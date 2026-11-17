import { getAppStore, WidgetManager, type WidgetProps } from 'jimu-core'

export const getWidgetComponentIds = id => ({
  root: `workflow-widget-root-${id}`,
  dialogRoot: `workflow-dialog-root-${id}`,
  icon: `workflow-widget-icon-${id}`,
  modalRoot: `workflow-modal-root-${id}`,
  modal: `workflow-modal-${id}`,
  modalHeader: `workflow-modal-header-${id}`,
  panel: `workflow-panel-${id}`,
  panelHeader: `workflow-panel-header-${id}`
})

/**
 * Check if a widget of a given ID has its class loaded. If not, load it.
 * @param widgetId The ID of the widget to load.
 */
export async function loadWidgetClass(widgetId: string): Promise<React.ComponentType<WidgetProps>> {
  if (!widgetId) return

  const isClassLoaded = getAppStore().getState().widgetsRuntimeInfo?.[widgetId]?.isClassLoaded
  if (!isClassLoaded) {
    return WidgetManager.getInstance().loadWidgetClass(widgetId)
  } else {
    return Promise.resolve(WidgetManager.getInstance().getWidgetClass(widgetId))
  }
}
