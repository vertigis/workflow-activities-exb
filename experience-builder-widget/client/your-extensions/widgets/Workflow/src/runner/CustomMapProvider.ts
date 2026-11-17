import { MapProvider } from '@vertigis/workflow/activities/arcgis/MapProvider'
import { ExportWebMap } from '@vertigis/workflow/activities/arcgis/printing'
import { type Engine } from '@vertigis/workflow/execution/Engine'
import MapView from '@arcgis/core/views/MapView'
import type EsriMap from '@arcgis/core/Map'
import type View from '@arcgis/core/views/View'
import { interceptESRIExportWebMap, serialize } from './serialization'

export type CustomMapProviderType = MapProvider & {
  getWebMap: (printScale: number | undefined, local: boolean) => Promise<ExportWebMap>
}

export function register(engine: Engine, view: View) {
  class CustomMapProvider extends MapProvider {
    load() {
      if (this.view === undefined && view && view.map) {
        this.view = view
        this.map = view.map
      }
      return super.load()
    }

    getExtent() {
      if (this.view) {
        return (this.view as MapView).extent
      }
    }

    getScale() {
      if (this.view) {
        return (this.view as MapView).scale
      }
    }

    async getWebMap(printScale: number | undefined, local: boolean) {
      if (local) {
        return await this.getWebMapLocal(printScale)
      }
      return await interceptESRIExportWebMap(this.view as MapView, printScale)
    }

    private async getWebMapLocal(printScale: number | undefined): Promise<ExportWebMap> {
      const webMap = await serialize(this.map as EsriMap)

      return webMap
    }
  }

  CustomMapProvider.register(engine.activator)
}
