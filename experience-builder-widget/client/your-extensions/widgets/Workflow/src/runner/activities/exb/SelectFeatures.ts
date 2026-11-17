import { type IActivityContext, type IActivityHandler } from '@vertigis/workflow/IActivityHandler'
import type Graphic from 'esri/Graphic'
import {
  DataRecordsSelectionChangeMessage,
  MessageManager,
  type FeatureDataRecord
} from 'jimu-core'
import { EXB_ACTIVITY_PACK_UUID } from '../customActivityPackManifest'
import { assertSelectionSupported, findLayerDataSource, getTrivia } from '../exbSelection'

interface SelectFeaturesInputs {
  features: Graphic[] | { features: Graphic[] }
  objectIdField?: string
  layerId: string
}

export class SelectFeatures implements IActivityHandler {
  static readonly action = `${EXB_ACTIVITY_PACK_UUID}::SelectFeatures`

  static readonly suite = EXB_ACTIVITY_PACK_UUID

  async execute(inputs: SelectFeaturesInputs, context: IActivityContext): Promise<void> {
    assertSelectionSupported(context, 'Select Features')

    const dataSource = await findLayerDataSource(inputs.layerId, context)
    const widgetId = getTrivia(context).widget.id

    // Accept either an array of features or a FeatureSet.
    const features = Array.isArray(inputs.features)
      ? inputs.features
      : inputs.features?.features ?? []

    // Get a list of object Ids from the features in the feature set.
    const objectIdField = inputs.objectIdField || dataSource.getIdField()
    const objectIds = features
      .map(feature => feature.attributes?.[objectIdField])
      .filter(id => id !== undefined && id !== null)

    // Query the layer's data source for the matching records. ExB needs its own records
    // (not esri Graphics) for both the selection and the selection change message.
    let records: FeatureDataRecord[] = []
    if (objectIds.length) {
      const results = await dataSource.query({
        objectIds,
        outFields: ['*'],
        returnGeometry: true
      })
      records = results.records as FeatureDataRecord[]
    }

    dataSource.selectRecordsByIds(records.map(record => record.getId()), records)
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, records, [dataSource.id])
    )
  }
}
