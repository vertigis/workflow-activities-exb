import { type IActivityHandler } from '@vertigis/workflow/IActivityHandler'
import { appActions, getAppStore } from 'jimu-core'
import { EXB_ACTIVITY_PACK_UUID } from '../customActivityPackManifest'
import { loadWidgetClass } from '../../../utils'

interface OpenWidgetInputs {
  widgetId: string
}

export class OpenWidget implements IActivityHandler {
  static readonly action = `${EXB_ACTIVITY_PACK_UUID}::OpenWidget`

  static readonly suite = EXB_ACTIVITY_PACK_UUID

  async execute(inputs: OpenWidgetInputs): Promise<void> {
    // Load the widget class prior to executing the open/close actions
    await loadWidgetClass(inputs.widgetId)
    const openAction = appActions.openWidget(inputs.widgetId)
    getAppStore().dispatch(openAction)
  }
}
