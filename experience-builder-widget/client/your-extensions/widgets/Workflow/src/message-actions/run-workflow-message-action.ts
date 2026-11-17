import {
  AbstractMessageAction,
  Message,
  MessageDescription,
  MessageType,
  appActions,
  getAppStore
} from 'jimu-core'
import { loadWidgetClass } from '../utils'
import { IMActionConfig } from './run-workflow-message-action-setting'

export default class RunWorkflowAction extends AbstractMessageAction {
  filterMessageDescription(_messageDescription: MessageDescription): boolean {
    return true
  }

  filterMessage(_message: Message): boolean {
    return true
  }

  getSettingComponentUri(_messageType: MessageType, _messageWidgetId?: string): string {
    return 'message-actions/run-workflow-message-action-setting'
  }

  async onExecute(message: Message, actionConfig?: IMActionConfig): Promise<boolean> {
    await loadWidgetClass(this.widgetId)
    const openAction = appActions.openWidget(this.widgetId)
    getAppStore().dispatch(openAction)

    const params = [{ name: 'context', value: message }, ...(actionConfig?.parameters ?? [])]

    const event = new Event('start-workflow', { bubbles: true })
    ;(event as any).widgetId = this.widgetId
    ;(event as any).workflowInfo = actionConfig?.workflow
    ;(event as any).workflowParameters = params
    window.document.dispatchEvent(event)
    return true
  }
}
