import { type IActivityHandler } from '@vertigis/workflow/IActivityHandler'
import { appActions, getAppStore } from 'jimu-core'
import { EXB_ACTIVITY_PACK_UUID } from '../customActivityPackManifest'
import { loadWidgetClass } from '../../../utils'

interface CloseWidgetInputs {
  widgetId: string
}

export class CloseWidget implements IActivityHandler {
  static readonly action = `${EXB_ACTIVITY_PACK_UUID}::CloseWidget`

  static readonly suite = EXB_ACTIVITY_PACK_UUID

  async execute(inputs: CloseWidgetInputs): Promise<void> {
    // Load the widget class prior to executing the open/close actions
    await loadWidgetClass(inputs.widgetId)
    const closeAction = appActions.closeWidget(inputs.widgetId)
    getAppStore().dispatch(closeAction)
  }
}
