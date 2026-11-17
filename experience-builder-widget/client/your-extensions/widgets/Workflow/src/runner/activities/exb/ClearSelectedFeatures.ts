import { type IActivityContext, type IActivityHandler } from '@vertigis/workflow/IActivityHandler'
import { DataRecordsSelectionChangeMessage, MessageManager } from 'jimu-core'
import { EXB_ACTIVITY_PACK_UUID } from '../customActivityPackManifest'
import { assertSelectionSupported, findLayerDataSource, getTrivia } from '../exbSelection'

interface ClearSelectedFeaturesInputs {
  layerId: string
}

export class ClearSelectedFeatures implements IActivityHandler {
  static readonly action = `${EXB_ACTIVITY_PACK_UUID}::ClearSelectedFeatures`

  static readonly suite = EXB_ACTIVITY_PACK_UUID

  async execute(inputs: ClearSelectedFeaturesInputs, context: IActivityContext): Promise<void> {
    assertSelectionSupported(context, 'Clear Selected Features')

    const dataSource = await findLayerDataSource(inputs.layerId, context)
    const widgetId = getTrivia(context).widget.id

    dataSource.clearSelection()
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, [], [dataSource.id])
    )
  }
}
