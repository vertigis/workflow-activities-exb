import type { IActivityHandler } from "@vertigis/workflow";
import Graphic from "@arcgis/core/Graphic";
import { ActivityNotImplementedError } from "@vertigis/workflow/Errors";

/** An interface that defines the inputs of the activity. */
interface SelectFeaturesInputs {
    /**
     * @displayName Features
     * @description A collection of features that contains all the features that will be marked as selected.
     * @required
     */
    features: Graphic[];

    /**
     * @displayName Layer ID
     * @description The ID of the layer that contains the features that will be marked as selected.
     * @required
     */
    layerId: string;

    /**
     * @displayName Object ID Field
     * @description The name of the Object ID field of the features that will be marked as selected.
     * @required
     */
    objectIdField: string;
}

/**
 * @displayName SelectFeatures
 * @category Experience Builder
 * @description Select features in exb using the DataSelectionRecordChange message action.
 */
export default class SelectFeaturesActivity implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    execute(inputs: SelectFeaturesInputs): Promise<void> {
        throw new ActivityNotImplementedError("SelectFeatures");
    }
}
