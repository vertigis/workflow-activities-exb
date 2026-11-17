# Experience Builder Workflow Widget source

This directory contains the developer source for the VertiGIS Studio Workflow widget
from the supplied 3.0.1 Developer ZIP. The source is kept under
`client/your-extensions/widgets/Workflow` to preserve the folder layout expected by
ArcGIS Experience Builder.

The widget manifest requires Experience Builder 1.21.0 or later. To build this
widget, copy `client/your-extensions/widgets/Workflow` into the same relative
location in a compatible Experience Builder Developer Edition checkout, install
the widget dependencies using that checkout's extension setup, and build the
Experience Builder client.

`GetSelectedFeatures` is implemented and registered in this widget source. The
activity pack in the repository root supplies its Designer definition; the widget
implementation supplies the runtime behavior.
