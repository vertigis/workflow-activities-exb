import * as jsonUtils from '@arcgis/core/symbols/support/jsonUtils'
import {
  SymbolFromJson,
  type SymbolFromJsonOutputs,
  type SymbolFromJsonInputs
} from '@vertigis/workflow/activities/arcgis/SymbolFromJson'

export class SymbolFromJsonExB extends SymbolFromJson {
  execute(inputs: SymbolFromJsonInputs): SymbolFromJsonOutputs {
    if (!inputs.json) {
      // Bail out if we don't have a useful input
      return { symbol: undefined }
    }

    // The JSON as an object
    const json = typeof inputs.json === 'string' ? JSON.parse(inputs.json) : inputs.json

    const sym = jsonUtils.fromJSON(json)
    return { symbol: sym }
  }
}
