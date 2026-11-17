# VertiGIS Studio Workflow Widget

This widget enables you to run VertiGIS Studio Workflows in ArcGIS Experience Builder.

## Customizing your Workflow Widget

The Workflow widget can be customized to work for your specific use case. After making any changes to your widget, make sure to re-build the widget with the Experience Builder client's build script, either `npm run start`, `npm run build:dev`, or `npm run build:prod`.

### Running Workflows as Data Actions

To Run Data actions with your workflow widgets you need to modify the `manifest.json` file in this folder. Add this to the manifest in the `dataActions` section:

```
{
    "name": "runWorkflow",
    "label": "Run Workflow",
    "uri": "data-actions/run-workflow-data-action",
    "settingUri": "data-actions/run-workflow-data-action-setting",
    "icon": "runtime/assets/workflow-icon.svg"
}
```

You can change the icon path to another icon added to this widget or to any accessible absolute url to an icon. You can change the label to whatever label you would like to use for your data action.

> **_NOTE:_** If you change the label you may need to change the label translation found in `src/runtime/translations/default.ts`. Change the `_action_runWorkflow_label_` value to match the label you have set in the manifest.

> **_NOTE:_** If you are running Experience Builder in a locale other than **en**, repeat this step in your desired locale file in the translations folder.

### Custom Activity Packs

The Workflow widget loads custom activity packs from their URL when a workflow runs, the same as other VertiGIS Studio apps. You do not need to add them to the widget or rebuild Experience Builder. The activity pack must be built with the [VertiGIS Studio Workflow SDK](https://github.com/vertigis/vertigis-workflow-sdk).

Activity packs include their own dependencies, except for the modules that the SDK leaves out of every activity pack. The widget supplies these modules:

-   The VertiGIS Studio Workflow runtime (`@vertigis/workflow`).
-   VertiGIS Studio React UI (`@vertigis/react-ui`), except `@vertigis/react-ui/AdapterMoment`.
-   The ArcGIS Maps SDK for JavaScript (`@arcgis/core`).
-   React.
-   The VertiGIS Studio ArcGIS Extensions modules (`@vertigis/arcgis-extensions`) that the widget uses itself.

If an activity pack needs another module that the SDK leaves out, the workflow fails with an error that names the module.

### Get Selected Features

The **Get Selected Features** activity is implemented by this widget and its definition
is provided by the Experience Builder activity pack in this repository. Add the
activity pack to the workflow widget, then use **Get Selected Features** without
inputs. Its `features` output contains the selected ArcGIS graphics from the app's
feature-layer data sources. This activity requires Experience Builder 1.12.0 or later.

> ⚠️ **Modifying Widget Content**: Modifying the content of this widget, especially the `node_modules`, can cause this widget not to build or load properly. Doing so may require a reinstall of the widget and a loss of data.

## Using the Workflow Widget in ArcGIS Enterprise

As of ArcGIS Enterprise version 11.0, you can run custom Experience Builder widgets in Portal. To do so with your workflow widget [follow the steps here.](https://doc.arcgis.com/en/experience-builder/11.0/configure-widgets/add-custom-widgets.htm)
