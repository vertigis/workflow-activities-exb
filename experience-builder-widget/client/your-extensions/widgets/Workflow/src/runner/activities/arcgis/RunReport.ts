import Extent from '@arcgis/core/geometry/Extent'
import { GenerateWebmapForReport } from '@vertigis/workflow/activities/arcgis/GenerateWebmapForReport'
import { MapProvider } from '@vertigis/workflow/activities/arcgis/MapProvider'
import type { ExportWebMap } from '@vertigis/workflow/activities/arcgis/printing'
import { RunReport } from '@vertigis/workflow/activities/arcgis/RunReport'
import { type JobParameter } from '@vertigis/workflow/activities/arcgis/runUtils'
import { CustomMapProviderType } from '../../CustomMapProvider'
import { getWgs84Extent, prepareWebmapParameters } from './shared'

export class RunReportExB extends RunReport {
  /**
   * Generates a webmap from an esri map.
   * @param mapProvider The mapProvider.
   * @param scale The scale at which the webmap should be generated. Layers visible in the map at this scale will be included in the webmap.
   */
  override async getWebmap(mapProvider: MapProvider, scale?: number): Promise<ExportWebMap> {
    await mapProvider.load()
    return await (mapProvider as CustomMapProviderType).getWebMap(scale, true)
  }

  override async getWebmapExtent(mapProvider: MapProvider): Promise<Extent> {
    await mapProvider.load()
    return await getWgs84Extent((mapProvider as CustomMapProviderType).getExtent())
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

export class GenerateWebmapForReportExB extends GenerateWebmapForReport {
  /**
   * Generates a webmap from an esri map.
   *
   * @param mapProvider The mapProvider.
   * @param scale The scale at which the webmap should be generated. This will
   *   be handled by Reporting.
   * @param trivia The trivia.
   */
  override async getWebmap(
    mapProvider: CustomMapProviderType,
    scale?: number,
    trivia?: any
  ): Promise<ExportWebMap> {
    await mapProvider.load()
    return await (mapProvider as CustomMapProviderType).getWebMap(scale, true)
  }

  /**
   * Projects the provided geometry to WGS84.
   *
   * @param extent The extent to project.
   */
  override async getWgs84Extent(extent: Extent): Promise<Extent> {
    return getWgs84Extent(extent)
  }
}
