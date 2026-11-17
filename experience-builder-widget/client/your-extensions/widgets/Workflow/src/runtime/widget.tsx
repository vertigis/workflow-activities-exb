/* eslint-disable multiline-ternary */
/** @jsx jsx */
import { type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import {
  type AllWidgetProps,
  type AppContext,
  type IMAppConfig,
  type IMAppInfo,
  type ImmutableObject,
  type IMRuntimeInfos,
  type IMState,
  appActions,
  type AppMode,
  getAppStore,
  jsx,
  React
} from 'jimu-core'
import { Icon, Modal, ModalBody } from 'jimu-ui'
import { useCallback } from 'react'
import { type IMConfig, type Parameter } from '../config'
import { Runner } from '../runner/runner'
import { setFormTheme } from '../runner/formTheme'
import { getWidgetComponentIds } from '../utils'
import { getStyles } from './styles'
import defaultMessages from './translations/default'
import { ActivityCancellationError } from '@vertigis/workflow/Errors'
const workflowIcon = require('./assets/workflow-icon.svg')
const workflowIconGS = require('./assets/workflow-icon-gs.svg')
const { useState, useEffect } = React

interface ExtraProps {
  appConfig: IMAppConfig
  appContext: ImmutableObject<AppContext>
  appMode?: AppMode
  appInfo: IMAppInfo
  widgetsRuntimeInfo: IMRuntimeInfos
}

export type WorkflowWidgetProps = AllWidgetProps<IMConfig> & ExtraProps

export interface WorkflowFinishedEvent {
  widgetId: string
  workflowOutputs: any
}

export const Widget: React.FC<WorkflowWidgetProps> = props => {
  const [mapView, setMapView] = useState<any>(null)
  const [showPopup, setShowPopup] = useState<boolean>(false)
  const [hasLaunched, setHasLaunched] = useState<boolean>(false)
  const [showLogo, setShowLogo] = useState<boolean>(true)

  const componentIds = getWidgetComponentIds(props.widgetId)

  // Keep open forms in sync when the ExB theme changes.
  useEffect(() => {
    setFormTheme(props.id, props.theme)
  }, [props.id, props.theme])

  const activeViewChangeHandler = (view: JimuMapView) => {
    setMapView(view)
  }

  const handleWorkflowFinished = useCallback(
    (error: Error | undefined, outputs: object | undefined) => {
      setShowLogo(true)

      if (error) {
        if (error instanceof ActivityCancellationError) {
          console.warn(`Workflow in '${props.widgetId}' was cancelled.`)
        } else {
          console.error(`The workflow in '${props.widgetId}' failed with an error.`)
          console.error(error)
        }
        return
      }

      // Publish event when workflow completes.
      const e = new Event('workflow-complete', { bubbles: true })
      ;(e as any).widgetId = props.widgetId
      ;(e as any).workflowOutputs = outputs
      ;(e as any).error = error
      window.document.dispatchEvent(e)

      // Close containing panel (widget controller, tab, etc.)
      const closeAction = appActions.closeWidget(props.widgetId)
      getAppStore().dispatch(closeAction)
    },
    [props.widgetId]
  )

  const runWorkflow = useCallback(
    async (customParams: Parameter[] = [], alternateWorkflowUrl?: string) => {
      // If a map has been selected, wait for it to be ready before running the workflow. Otherwise, run it immediately.
      if (
        (props.useMapWidgetIds?.length && mapView?.view?.ready) ||
        !props.useMapWidgetIds?.length
      ) {
        setShowLogo(false)
        const runner = Runner.getInstance()
        setHasLaunched(true)

        await runner.runWorkflow(
          defaultMessages,
          mapView,
          props as any,
          alternateWorkflowUrl ?? props.config.workflowInfo.itemUrl,
          [...props.config.workflowParameters.asMutable(), ...customParams],
          handleWorkflowFinished,
          setShowPopup
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapView, props.widgetId, props.config, handleWorkflowFinished]
  )

  useEffect(() => {
    window.addEventListener('start-workflow', startWorkflowEventHandler)
    return () => {
      window.removeEventListener('start-workflow', startWorkflowEventHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView, props])

  const isAllowedWorkflow = (url: string) => {
    if (props.config.workflowInfo.itemUrl === url) {
      return true
    }
    if ((props.config.allowedWorkflows ?? []).findIndex(wf => wf.itemUrl === url) > -1) {
      return true
    }
    return false
  }

  const startWorkflowEventHandler = event => {
    if (event.widgetId === props.widgetId) {
      const url = isAllowedWorkflow(event.workflowInfo?.itemUrl)
        ? event.workflowInfo?.itemUrl
        : props.config.workflowInfo.itemUrl
      runWorkflow(event.workflowParameters, url)
    }
  }

  // Run the workflow only on start.
  useEffect(() => {
    if (props.config.startOperation === 'onStart' && props.appMode === 'RUN' && !hasLaunched) {
      runWorkflow()
    }
  })

  // Run the workflow every time it's containing panel is open.
  useEffect(() => {
    if (
      props.config.startOperation === 'onOpen' &&
      props.appMode === 'RUN' &&
      props.widgetsRuntimeInfo[props.widgetId]?.state === 'OPENED'
    ) {
      runWorkflow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.widgetsRuntimeInfo[props.widgetId]?.state, runWorkflow])

  // Run the workflow every time the icon is clicked.
  const handleClickWidget = () => {
    if (props.config.startOperation === 'onClick' && props.appMode === 'RUN') {
      runWorkflow()
    }
  }

  return (
    <div
      css={getStyles(props.theme, '', props.id)}
      style={{ maxHeight: '100%', overflowY: 'auto' }}
      id={componentIds.root}
    >
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={activeViewChangeHandler}
      />
      {(props.config.showIcon || props.config.startOperation === 'onClick') && showLogo ? (
        <div onClick={handleClickWidget} id={componentIds.icon}>
          <Icon
            className={props.config.startOperation === 'onClick' ? 'logo clickable' : 'logo'}
            icon={workflowIcon}
          />
        </div>
      ) : (
        props.appMode === 'DESIGN' && <Icon className="logo" icon={workflowIconGS} />
      )}
      <div id={componentIds.panelHeader} className="gcx-form-header hidden"></div>
      <div id={componentIds.panel} className="gcx-forms defaults hidden"></div>
      <div id={componentIds.dialogRoot}></div>
      <Modal
        id={componentIds.modalRoot}
        size="xl"
        isOpen={showPopup}
        css={getStyles(props.theme, '', props.id)}
        style={{
          maxWidth: '60rem',
          height: '60rem'
        }}
      >
        <div id={componentIds.modalHeader} className="gcx-form-header"></div>
        <ModalBody id={componentIds.modal} className="workflow-modal-root"></ModalBody>
      </Modal>
    </div>
  )
}
;(Widget as any).mapExtraStateProps = (state: IMState): ExtraProps => {
  return {
    appContext: state.appContext,
    appConfig: state.appConfig,
    appMode: state.appRuntimeInfo.appMode,
    appInfo: state.appInfo,
    widgetsRuntimeInfo: state.widgetsRuntimeInfo
  }
}

export default Widget
