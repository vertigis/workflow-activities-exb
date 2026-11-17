import esriConfig from '@arcgis/core/config'
import IdentityManager from '@arcgis/core/identity/IdentityManager'
import GroupLayer from '@arcgis/core/layers/GroupLayer'
import type Layer from '@arcgis/core/layers/Layer'
import { execute as getPrintSpecification } from '@arcgis/core/rest/print'
import PrintParameters from '@arcgis/core/rest/support/PrintParameters'
import MapView from '@arcgis/core/views/MapView'
import type WebMap from '@arcgis/core/WebMap'
import type EsriMap from '@arcgis/core/Map'
import type { RequestInterceptor } from '@arcgis/core/request/types'
import type { FeatureLayerJson } from '@vertigis/arcgis-extensions/json/FeatureLayerJson'
import type { GroupLayerJson } from '@vertigis/arcgis-extensions/json/GroupLayerJson'
import { layerToJson, type LayerJson } from '@vertigis/arcgis-extensions/json/LayerJson'
import type { OperationalLayerJson } from '@vertigis/arcgis-extensions/json/OperationalLayerJson'
import type { WebMapJson } from '@vertigis/arcgis-extensions/json/WebMapJson'
import { webMapToJson } from '@vertigis/arcgis-extensions/json/WebMapJson'
import {
  isFeatureLayer,
  isGraphicsLayer,
  isGroupLayer,
  isMapImageLayer
} from '@vertigis/arcgis-extensions/utilities/layers'
import { ExportWebMap } from '@vertigis/workflow/activities/arcgis/printing'

const ESRI_AGOL_PRINT_TASK_URL =
  'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'

export const serialize = async (map: EsriMap): Promise<ExportWebMap> => {
  const json = await mapModelToGeocortexJobJSON(map)
  return json as unknown as ExportWebMap
}

// ESRI loads map image sublayers on demand. We need to do the same to ensure
// that correct drawing info is available client-side.
async function loadMapImageSublayers(map: EsriMap): Promise<void[]> {
  return Promise.all(
    map.allLayers
      ?.toArray()
      .filter((layer: unknown) => isMapImageLayer(layer))
      .flatMap((layer: { allSublayers: { toArray: () => any } }) => layer.allSublayers.toArray())
      .map((layer: { loadStatus: string; load: () => Promise<void> }) =>
        layer.loadStatus === 'not-loaded'
          ? (layer.load().catch(() => {}) as Promise<void>)
          : Promise.resolve()
      ) ?? []
  )
}

async function mapModelToGeocortexJobJSON(map: EsriMap): Promise<WebMapJson> {
  const handleAddedGroupLayer = (
    groupLayer: GroupLayer,
    mainJsonArrayToAddTo: LayerJson[],
    targetPositionInArray: number
  ): void => {
    const groupLayerJson = layerToJson(groupLayer) as GroupLayerJson
    groupLayerJson.layers = []

    handleAddedLayers(groupLayer.layers.toArray(), groupLayerJson.layers)

    // If the groupLayer has any layers in it here, it means that at least one
    // of the sublayers had features in it so add it to the group layer
    // json.
    if (groupLayerJson.layers.length !== 0) {
      mainJsonArrayToAddTo.splice(targetPositionInArray, 0, groupLayerJson)
    }
  }

  const handleAddedLayers = (layers: Layer[], jsonLayersArrayToAddTo: LayerJson[]): void => {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      if (json.operationalLayers.find(lj => lj.id === layer.id)) {
        continue
      }

      if (isFeatureLayer(layer) || isGraphicsLayer(layer)) {
        const layerJson = layerToJson(layer) as FeatureLayerJson
        // Client-side feature layers are not serialized by Esri's API.
        // Serialize and add them manually, but only if they contain
        // features, since printing will return a blank template if any
        // featureCollection-based layers that contain no features are
        // included.
        if (
          layerJson?.featureCollection?.layers?.some(
            sublayer => !!sublayer.featureSet?.features?.length
          )
        ) {
          jsonLayersArrayToAddTo.splice(i, 0, layerJson)
        }
      } else if (isGroupLayer(layer)) {
        handleAddedGroupLayer(layer, jsonLayersArrayToAddTo, i)
      }
    }
  }

  await loadMapImageSublayers(map)

  const json = webMapToJson(map as WebMap)

  handleAddedLayers(map.layers.toArray(), json.operationalLayers)

  // Printing expects a token property for secured services that does not
  // conform to the webmap spec, iterate through the operational layers
  // and add the token (if we have one).
  const updateLayerWithToken = (layer: OperationalLayerJson): void => {
    if (layer.hasOwnProperty('url')) {
      const token = IdentityManager.findCredential((layer as FeatureLayerJson).url)?.token
      if (token) {
        ;(layer as unknown as Record<string, unknown>)['token'] = token
      }
    }
  }

  json.operationalLayers.forEach(updateLayerWithToken)
  return json
}

/**
 * Intercepts print request to static ArcGIS Online printing endpoint to
 * fetch the Export Web Map created according to the ESRI Export Web Map
 * Specification:
 * https://enterprise.arcgis.com/en/server/latest/publish-services/linux/exportwebmap-specification.htm.
 *
 * @param mapView The map view.
 * @param printScale The print scale.
 * @param mapScale The map scale.
 * @returns The intercepted export web map.
 */
export async function interceptESRIExportWebMap(
  mapView: MapView,
  printScale: number | undefined,
  mapScale?: number
): Promise<ExportWebMap> {
  const abortController = new AbortController()
  const { signal } = abortController
  const printParams = new PrintParameters({ view: mapView })

  if (printScale) {
    // By changing the map view to the print scale we include layers as operational layers visible at print scale. This is not done by default. By default only layers visible at map scale are part of the export web map.
    console.debug(
      `Update map view: set print scale as map view scale: ${mapView.scale} > ${printScale}`
    )
    mapView.scale = printScale
  }

  let exportWebMap: ExportWebMap
  const interceptor: RequestInterceptor = {
    urls: ESRI_AGOL_PRINT_TASK_URL,

    before(params) {
      console.debug(
        'Param: ###########################################################################'
      )
      console.debug(`Param: export web map: fetching for scale: ${mapView.scale} ...`)
      exportWebMap = JSON.parse(
        (params.requestOptions.query as Record<string, unknown>).Web_Map_as_JSON as string
      )
      abortController.abort()
      if (mapScale) {
        // We zoom back to the original map scale
        console.debug(`Update map view: restore map view scale: ${mapView.scale} > ${mapScale}`)
        mapView.scale = mapScale
      }
    }
  }

  esriConfig.request.interceptors.splice(0, 0, interceptor)

  await getPrintSpecification(ESRI_AGOL_PRINT_TASK_URL, printParams, { signal }).catch(() => {})

  // Interceptor must be removed from array if it is to be used multiple times in an app session.
  esriConfig.request.interceptors.splice(0, 1)
  if (exportWebMap) {
    console.debug(`Param: export web map: intercepted from call: '${ESRI_AGOL_PRINT_TASK_URL}'`)
    console.debug(
      `Param: export web map: map options: ${
        exportWebMap.mapOptions ? JSON.stringify(exportWebMap.mapOptions).length : 0
      } chars.`
    )
    console.debug(
      `Param: export web map: export options: ${
        exportWebMap.exportOptions ? JSON.stringify(exportWebMap.exportOptions).length : 0
      } chars.`
    )
    console.debug(
      `Param: export web map: layout options: ${
        exportWebMap.layoutOptions ? JSON.stringify(exportWebMap.layoutOptions).length : 0
      } chars.`
    )
    console.debug(
      `Param: export web map: operational layers: ${
        exportWebMap.operationalLayers ? exportWebMap.operationalLayers.length : 0
      } layers.`
    )
    console.debug(
      `Param: export web map: basemap layers: ${
        exportWebMap.baseMap?.baseMapLayers ? exportWebMap.baseMap?.baseMapLayers.length : 0
      } layers.`
    )
  } else {
    throw new Error(`Failed to intercept export web map from call '${ESRI_AGOL_PRINT_TASK_URL}'`)
  }

  return exportWebMap
}
