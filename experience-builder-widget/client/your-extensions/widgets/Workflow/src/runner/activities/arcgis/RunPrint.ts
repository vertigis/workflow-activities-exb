import Extent from '@arcgis/core/geometry/Extent'
import type { MapProvider } from '@vertigis/workflow/activities/arcgis/MapProvider'
import type { PrintType } from '@vertigis/workflow/activities/arcgis/RunPrint'
import { RunPrint } from '@vertigis/workflow/activities/arcgis/RunPrint'
import type { ExportWebMap } from '@vertigis/workflow/activities/arcgis/printing'
import type { JobParameter } from '@vertigis/workflow/activities/arcgis/runUtils'
import MapView from 'esri/views/MapView'
import SceneView from 'esri/views/SceneView'
import type { CustomMapProviderType } from '../../CustomMapProvider'
import { getWgs84Extent, prepareWebmapParameters } from './shared'

export default class RunPrintExB extends RunPrint {
  /**
   * Generates a webmap from an esri map.
   * @param mapProvider The mapProvider.
   * @param scale The scale at which the webmap should be generated. Layers visible in the map at this scale will be included in the webmap.
   */
  override async getWebmap(
    printType: PrintType,
    mapProvider: MapProvider,
    scale?: number
  ): Promise<ExportWebMap> {
    await mapProvider.load()
    if (!(mapProvider.view instanceof MapView)) {
      const message =
        mapProvider.view instanceof SceneView
          ? 'Workflow Sandbox does not support the Run Print activity with 3D scenes. You will need to use the Debug Web Map environment when using this activity.'
          : 'Workflow Sandbox does not support the Run Print activity without a map. You will need to use the Debug Web Map environment when using this activity.'
      console.warn(message)
      return undefined as any
    }
    if (printType === 'layout') {
      return await (mapProvider as CustomMapProviderType).getWebMap(scale, false)
    }
    return await (mapProvider as CustomMapProviderType).getWebMap(scale, true)
  }

  override async getWgs84Extent(extent: Extent): Promise<Extent> {
    return await getWgs84Extent(extent)
  }

  /**
   * Shapes parameters related to webmaps for consumption by the Printing/Reporting service.
   * @param mapName The name of the map control in the Report/Print template.
   * @param webmap The webmap.
   * @param scale The scale.
   * @param extent The extent.
   */
  override prepareWebmapParameters(
    mapName: string,
    webmap: ExportWebMap,
    scale: number,
    extent?: Extent
  ): JobParameter[] {
    return prepareWebmapParameters(mapName, webmap, scale, extent)
  }
}
