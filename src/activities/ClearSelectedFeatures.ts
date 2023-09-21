import type { IActivityHandler } from "@vertigis/workflow";
import { ActivityNotImplementedError } from "@vertigis/workflow/Errors";

/** An interface that defines the inputs of the activity. */
interface ClearSelectedFeaturesInputs {
    /**
     * @displayName Layer ID
     * @description The ID of the layer that contains the features that will be marked as selected.
     * @required
     */
    layerId: string;
}

/**
 * @displayName ClearSelectedFeatures
 * @category Experience Builder
 * @description Clear all selected features on a given layer.
 */
export default class ClearSelectedFeaturesActivity implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(inputs: ClearSelectedFeaturesInputs): Promise<void> {
        throw new ActivityNotImplementedError("SelectFeatures");
    }
}
