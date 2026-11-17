import type { EmptyInputs, IActivityHandler } from "@vertigis/workflow/IActivityHandler";
import Graphic from "@arcgis/core/Graphic";
import { ActivityNotImplementedError } from "@vertigis/workflow/Errors";

/** An interface that defines the outputs of the activity. */
interface GetSelectedFeaturesOutputs {
    /**
     * @displayName Features
     * @description The selected features from all feature-layer data sources in the app.
     */
    features: Graphic[];
}

/**
 * @displayName Get Selected Features
 * @category Experience Builder
 * @description Gets selected features from all feature-layer data sources in the Experience Builder app.
 * @clientOnly
 * @supportedApps EXB
 */
export default class GetSelectedFeatures implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(inputs: EmptyInputs): Promise<GetSelectedFeaturesOutputs> {
        throw new ActivityNotImplementedError("GetSelectedFeatures");
    }
}
