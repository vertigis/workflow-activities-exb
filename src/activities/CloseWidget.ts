import type { IActivityHandler } from "@vertigis/workflow";
import { ActivityNotImplementedError } from "@vertigis/workflow/Errors";

/** An interface that defines the inputs of the activity. */
interface CloseWidgetInputs {
    /**
     * @displayName Widget ID
     * @description The ID of the widget that will be closed.
     * @required
     */
    widgetId: string;
}
/**
 * @displayName Close Widget
 * @category Experience Builder
 * @description Closes an Experience Builder widget.
 */
export default class CloseWidget implements IActivityHandler {
    /** Perform the execution logic of the activity. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(inputs: CloseWidgetInputs): Promise<void> {
        throw new ActivityNotImplementedError("CloseWidget");
    }
}
