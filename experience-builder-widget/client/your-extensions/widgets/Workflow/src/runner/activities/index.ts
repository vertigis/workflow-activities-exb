import { type IActivityHandlerImplementation } from '@vertigis/workflow/execution/Engine'
import { GetApplicationInfoEXB } from './app/GetApplicationInfo'
import { GetUserInfoEXB } from './app/GetUserInfo'
import { RendererFromJsonExB } from './arcgis/RendererFromJson'
import RunPrintExB from './arcgis/RunPrint'
import { GenerateWebmapForReportExB, RunReportExB } from './arcgis/RunReport'
import { SymbolFromJsonExB } from './arcgis/SymbolFromJson'
import { localCustomActivityPacks } from './customActivityPackManifest'

interface ModuleRef {
  export: string
  path: string
  import: () => Promise<any>
  suite: string
}

export interface Options {
  action?: string
  suite?: string
}

const defaults = {}

export function loadLocalCustomActivities(options: Options) {
  if (options !== undefined && options !== null) {
    const action = options.action
    if (typeof action === 'string') {
      const packs = localCustomActivityPacks as Record<string, ModuleRef[]>
      const refs: ModuleRef[] | undefined = packs[action]
      if (refs !== undefined) {
        for (const ref of refs) {
          if (ref.suite === options.suite) {
            return ref.import().then(function (exports) {
              return { [ref.export]: exports[ref.export] }
            })
          }
        }
      }
    }
  }

  return defaults
}

export function registerActivityImplementations(implementations: {
  [key: string]: IActivityHandlerImplementation
}) {
  // App
  implementations['gcx:wf:app::GetApplicationInfo'] = GetApplicationInfoEXB
  implementations['gcx:wf:app::GetUserInfo'] = GetUserInfoEXB
  // ArcGIS
  implementations['gcx:wf:arcgis::RendererFromJson'] = RendererFromJsonExB
  implementations['gcx:wf:arcgis::SymbolFromJson'] = SymbolFromJsonExB
  // vertigis
  implementations['gcx:wf:geocortex::GenerateWebmapForReport'] = GenerateWebmapForReportExB
  implementations['gcx:wf:geocortex::RunPrint'] = RunPrintExB
  implementations['gcx:wf:geocortex::RunReport'] = RunReportExB
}
