import { type IActivityContext } from '@vertigis/workflow/IActivityHandler'
import { MapViewManager, type JimuMapView } from 'jimu-arcgis'
import { DataSourceManager, type FeatureLayerDataSource } from 'jimu-core'
import { type WorkflowWidgetProps } from '../../runtime/widget'

interface Trivia {
  map?: __esri.MapView | __esri.SceneView
  widget: WorkflowWidgetProps
}

export function getTrivia(context: IActivityContext): Trivia {
  return context.ambient.trivia as Trivia
}

/**
 * Throws if the running Experience Builder version is older than 1.12.0, which is the
 * first version with the data source selection APIs these activities rely on.
 */
export function assertSelectionSupported(context: IActivityContext, activityName: string): void {
  const version = getTrivia(context).widget.appConfig.exbVersion
  const matches = version?.match(/(\d+)\.(\d+)\.(\d+)/)
  const major = +matches?.[1]
  const minor = +matches?.[2]
  if (!matches || (major === 1 && minor < 12) || major < 1) {
    throw new Error(
      `${activityName} activity is only supported in Experience Builder 1.12.0 and above.`
    )
  }
}

/**
 * Finds the main data source for the layer with the given id. The id can either be the
 * ArcGIS layer id or the ExB jimuLayerId (which joins parent/sublayer ids with "-").
 *
 * In current versions of ExB, data sources for map layers are created lazily, so if
 * no widget has needed the layer's data source yet it won't exist in the
 * DataSourceManager. In that case we go through the map's JimuLayerView to create it.
 */
export async function findLayerDataSource(
  layerId: string,
  context: IActivityContext
): Promise<FeatureLayerDataSource> {
  const dataSource =
    (await findDataSourceFromMap(layerId, getTrivia(context).map)) ??
    findDataSourceFromManager(layerId)

  if (!dataSource) {
    throw new Error(`Could not find feature layer data source with id ${layerId}`)
  }

  // Always select against the main data source rather than a data view or selection view.
  return (dataSource.getMainDataSource?.() ?? dataSource) as FeatureLayerDataSource
}

async function findDataSourceFromMap(
  layerId: string,
  view: __esri.MapView | __esri.SceneView | undefined
): Promise<FeatureLayerDataSource | undefined> {
  const mapViewManager = MapViewManager.getInstance()

  // Prefer the map the workflow widget is connected to, then fall back to any other map.
  // Match on `view` rather than using MapViewManager.getJimuMapViewByView, which is an
  // undocumented API that doesn't exist before ExB 1.21 (e.g. ArcGIS Enterprise installs).
  const jimuMapViews: JimuMapView[] = []
  for (const id of mapViewManager.getAllJimuMapViewIds()) {
    const jimuMapView = mapViewManager.getJimuMapViewById(id)
    if (!jimuMapView) {
      continue
    }
    if (view && jimuMapView.view === view) {
      jimuMapViews.unshift(jimuMapView)
    } else {
      jimuMapViews.push(jimuMapView)
    }
  }

  for (const jimuMapView of jimuMapViews) {
    const jimuLayerViews = await jimuMapView.whenAllJimuLayerViewLoaded()
    const jimuLayerView = Object.values(jimuLayerViews).find(
      layerView => layerView.jimuLayerId === layerId || layerView.layer?.id === layerId
    )
    if (jimuLayerView) {
      return (jimuLayerView.getLayerDataSource() ??
        (await jimuLayerView.createLayerDataSource())) as FeatureLayerDataSource
    }
  }

  return undefined
}

function findDataSourceFromManager(layerId: string): FeatureLayerDataSource | undefined {
  const dataSources = DataSourceManager.getInstance().getDataSources()
  return Object.values(dataSources).find(
    ds => (ds as FeatureLayerDataSource).jimuLayerId === layerId
  ) as FeatureLayerDataSource
}
