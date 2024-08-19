import type { IActivityHandler } from "@vertigis/workflow";
import { ActivityNotImplementedError } from "@vertigis/workflow/Errors";

/** An interface that defines the inputs of the activity. */
interface OpenWidgetInputs {
    /**
     * @displayName Widget ID
     * @description The ID of the widget that will be opened.
     * @required
     */
    widgetId: string;
}

/**
 * @displayName Open Widget
 * @category Experience Builder
 * @description Opens an Experience Builder widget.
 */
export default class OpenWidgetActivity implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    execute(inputs: OpenWidgetInputs): Promise<void> {
        throw new ActivityNotImplementedError("OpenWidget");
    }
}
