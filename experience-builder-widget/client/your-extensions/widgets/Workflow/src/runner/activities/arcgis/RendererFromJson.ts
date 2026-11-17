import * as jsonUtils from '@arcgis/core/renderers/support/jsonUtils'
import {
  RendererFromJson,
  type RendererFromJsonOutputs,
  type RendererFromJsonInputs
} from '@vertigis/workflow/activities/arcgis/RendererFromJson'

export class RendererFromJsonExB extends RendererFromJson {
  execute(inputs: RendererFromJsonInputs): RendererFromJsonOutputs {
    if (!inputs.json) {
      // Bail out if we don't have a useful input
      return { renderer: undefined }
    }

    // The JSON as an object
    const json = typeof inputs.json === 'string' ? JSON.parse(inputs.json) : inputs.json

    const renderer = jsonUtils.fromJSON(json)
    return { renderer: renderer }
  }
}
