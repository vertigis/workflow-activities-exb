import { AbstractDataAction, appActions, type DataLevel, type DataRecordSet, getAppStore, utils } from 'jimu-core'
import { type IMActionConfig } from './run-workflow-data-action-setting'
import { loadWidgetClass } from '../utils'

export default class RunWorkflowDataAction extends AbstractDataAction {
  async isSupported(_dataSets: DataRecordSet[], _dataLevel: DataLevel, _widgetId: string): Promise<boolean> {
    return true
  }

  getDataActionRuntimeUuid = widgetId => {
    const runtimeUuid = utils.getLocalStorageAppKey()
    return `${runtimeUuid}-${widgetId}-RunWorkflowDA`
  }

  deepClone = (obj: any): any => {
    const isArray = Array.isArray(obj)
    const cloneObj = isArray ? [] : {}
    for (const key in obj) {
      const isObject =
        (typeof obj[key] === 'object' || typeof obj[key] === 'function') && obj[key] !== null
      cloneObj[key] = isObject ? this.deepClone(obj[key]) : obj[key]
    }
    return cloneObj
  }

  async onExecute(
    dataSets: DataRecordSet[],
    _dataLevel: DataLevel,
    _widgetId: string,
    actionConfig?: IMActionConfig
  ): Promise<boolean> {
    await loadWidgetClass(this.widgetId)
    const openAction = appActions.openWidget(this.widgetId)
    getAppStore().dispatch(openAction)

    const params = [{ name: 'context', value: dataSets }, ...(actionConfig?.parameters ?? [])]

    const event = new Event('start-workflow', { bubbles: true })
    ;(event as any).widgetId = this.widgetId
    ;(event as any).workflowParameters = params
    window.document.dispatchEvent(event)
    return true
  }
}
