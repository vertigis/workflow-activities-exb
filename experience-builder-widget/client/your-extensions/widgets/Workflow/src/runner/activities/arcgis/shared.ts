import type Extent from '@arcgis/core/geometry/Extent'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import { project } from '@vertigis/arcgis-extensions/utilities/geometry'
import { ExportWebMap } from '@vertigis/workflow/activities/arcgis/printing'
import { type JobParameter } from '@vertigis/workflow/activities/arcgis/runUtils'

export async function getWgs84Extent(extent: Extent): Promise<Extent> {
  const [geometry] = await project([extent], SpatialReference.WGS84)
  return geometry as Extent
}

/**
 * Shapes parameters related to webmaps for consumption by the Printing/Reporting service.
 * @param mapName The name of the map control in the Report/Print template.
 * @param webmap The webmap.
 * @param scale The scale.
 */
export function prepareWebmapParameters(
  mapName: string,
  webmap: ExportWebMap,
  scale: number,
  extent?: Extent
): JobParameter[] {
  const webmapParameters = []

  // A parameter representing the scale of the printed map.
  const scaleParam = {
    name: `_${mapName}_scale`,
    containsSingleValue: true,
    value: scale
  }

  webmapParameters.push(scaleParam)

  const mapExtent = extent
    ? [
        [extent.xmin, extent.ymin],
        [extent.xmax, extent.ymax]
      ]
    : [
        [-180, -90],
        [180, 90]
      ]

  // A parameter matching the shape of a webmap stored in AGOL/Portal.
  const webmapParam = {
    $type: 'Parameters.WebMap',
    name: `_${mapName}_itemid`,
    item: {
      type: 'Web Map',
      extent: mapExtent
    },
    itemData: webmap
  }

  webmapParameters.push(webmapParam)

  return webmapParameters
}
