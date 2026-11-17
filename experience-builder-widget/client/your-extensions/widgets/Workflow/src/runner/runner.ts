import { type ActivityCancellationError } from '@vertigis/workflow/Errors'
import { ProgramInspectorFacility } from '@vertigis/workflow/ProgramInspectorFacility'
import { manifest } from '@vertigis/workflow/activities/index'
import { ConsoleDebugLogger } from '@vertigis/workflow/diagnostics/ConsoleDebugLogger'
import { Engine, type RunOptions } from '@vertigis/workflow/execution/Engine'
import { type Parameter } from '../config'
import { type WorkflowWidgetProps } from '../runtime/widget'
import { register as registerCustomChannelProvider } from './CustomChannelProvider'
import { register as registerCustomDialogProvider } from './CustomDialogProvider'
import { register as registerCustomFormRenderer } from './CustomFormRenderer'
import { register as registerCustomMapProvider } from './CustomMapProvider'
import { localCustomActivityPacks } from './activities/customActivityPackManifest'
import { registerActivityImplementations } from './activities/index'
import { ActivityLoader } from './execution/CustomActivityLoader'
import { getWidgetComponentIds } from '../utils'
import { CustomUIService } from './CustomUIService'

export const getReferencesFromManifest = () => {
  const references: any[] = []

  for (const value of Object.values(manifest)) {
    references.push(value[0])
  }

  for (const value of Object.values(localCustomActivityPacks)) {
    references.push(value[0])
  }

  return references
}

let _languageStrings: any

export function getLanguageStrings() {
  return _languageStrings
}

export class Runner {
  private static _instance: Runner = new Runner()

  /**
   * The name of the currently running application.
   * This is set to WAB right now to prevent issues with licensing.
   */
  appName = 'WAB'

  private readonly _piFacility: ProgramInspectorFacility

  /**
   * @param workflowWidget The workflow widget that is running the workflow.
   */
  constructor() {
    if (Runner._instance) {
      throw new Error('Instantiation failed: Use "Runner.getInstance()" instead of "new Runner()"')
    }
    Runner._instance = this

    this._piFacility = new ProgramInspectorFacility()
  }

  private static runningWidgetCancellations: { [key: string]: (() => void) | undefined } = {}
  public static getInstance(): Runner {
    return Runner._instance
  }

  async runWorkflow(
    languageStrings: any,
    map: any,
    workflowWidget: WorkflowWidgetProps,
    workflowUrl: string,
    workflowParameters: Parameter[],
    workflowFinished: (error: Error | undefined, outputs: object | undefined) => void,
    showModal: (show?: boolean) => void
  ) {
    // Cancel an existing workflow that might be running
    await Runner.runningWidgetCancellations[workflowWidget.id]?.()

    const cancellation = new Promise((resolve, reject) => {
      Runner.runningWidgetCancellations[workflowWidget.id] = reject
    })

    _languageStrings = languageStrings

    const componentIds = getWidgetComponentIds(workflowWidget.id)
    const uiService = new CustomUIService(
      componentIds.dialogRoot,
      workflowWidget.id,
      workflowWidget.theme
    )

    const loader = new ActivityLoader()
    loader.references.push(ActivityLoader.defaultReference, ...getReferencesFromManifest())

    // Setup console logging
    let debugHelper: ConsoleDebugLogger | undefined
    if (this.isConfigMode()) {
      debugHelper = new ConsoleDebugLogger()
    }

    const engine = new Engine(this.appName)
    engine.trivia = {
      ...engine.trivia,
      map: map?.view,
      widget: workflowWidget,
      theme: workflowWidget.theme,
      runWorkflow: (
        url: string,
        inputs: any,
        state: any,
        isDescendantOf: (state: any) => boolean
      ) => {
        const options: RunOptions = {
          cancellationToken: cancellation,
          debug: debugHelper?.onSession,
          inputs,
          locale: workflowWidget.appContext.locale,
          printingServiceUrl: workflowWidget.config.printingServiceUrl,
          state: state,
          trivia: {
            isDescendantOf: isDescendantOf
          }
        }
        return this._piFacility
          .resolveInspector(url, this.useCache())
          .then(programInspector => engine.run(programInspector, options))
      }
      // engine.trivia is not properly typed so we need to type this as any
      // to avoid linting errors.
    } as any

    registerActivityImplementations(engine.implementations)

    engine.factories.push(loader)

    const initializers = [
      registerCustomChannelProvider(engine),
      registerCustomMapProvider(engine, map?.view),
      registerCustomDialogProvider(engine, uiService),
      registerCustomFormRenderer(
        engine,
        map?.view,
        showModal,
        workflowWidget.theme,
        workflowWidget.id,
        workflowWidget.config.showFormTitle,
        uiService
      )
    ]

    // Create an workflow inputs object from the array of workflow params.  Duplicate keys will
    // be overridden.  These are marked as errors in the settings panel.
    const params: { [key: string]: any } = {}
    workflowParameters.forEach(p => (params[p.key] = p.value))

    const runOptions: RunOptions = {
      cancellationToken: cancellation,
      inputs: params,
      locale: workflowWidget.appContext.locale,
      printingServiceUrl: workflowWidget.config.printingServiceUrl,
      debug: debugHelper?.onSession
    }

    let error: Error | undefined
    let outputs
    try {
      await Promise.all(initializers)
      const programInspector = await this._piFacility.resolveInspector(
        workflowUrl,
        this.useCache(),
        undefined
      )
      outputs = await engine.run(programInspector, runOptions)
    } catch (e) {
      error = e as Error
    }
    workflowFinished(error, outputs)
  }

  private useCache(): boolean {
    return !this.isConfigMode()
  }

  private isConfigMode(): boolean {
    return true
  }
}
