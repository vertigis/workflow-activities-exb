# Experience Builder Activities

[![CI/CD](https://github.com/vertigis/workflow-activities-exb/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/vertigis/workflow-activities-exb/actions/workflows/ci-cd.yml)
[![npm](https://img.shields.io/npm/v/@vertigis/workflow-activities-exb)](https://www.npmjs.com/package/@vertigis/workflow-activities-exb)

This project contains activities to perform [ArcGIS Experience Builder](https://www.esri.com/en-us/arcgis/products/arcgis-experience-builder/overview) specific actions in a [VertiGIS Studio Workflow](https://www.vertigisstudio.com/products/vertigis-studio-workflow/).

> [!IMPORTANT]  
> This activity pack contains only activity definitions. The activity implementations are included in the VertiGIS Studio Workflow widget for Experience Builder. This activity pack does not need to be registered with your widget.

## Requirements

### VertiGIS Studio Workflow Versions

The Experience Builder activities are designed to work with VertiGIS Studio Workflow versions `5.37` and above and the VertiGIS Studio Workflow widget for Experience Builder versions 2.0 and above.
## Usage

To use the Experience Builder activities in [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/) you need to register an activity pack and then add the activities to a workflow.

### Register the Experience Builder activity pack

1. Sign in to ArcGIS Online or Portal for ArcGIS
1. Go to **My Content**
1. Select **Add Item > An application**
    - Type: `Web Mapping`
    - Purpose: `Ready To Use`
    - API: `JavaScript`
    - URL: The URL to this activity pack manifest
        - Use https://unpkg.com/@vertigis/workflow-activities-exb@1.0.0/activitypack.json for a specific version
        - Use https://unpkg.com/@vertigis/workflow-activities-exb@1/activitypack.json for the latest revision of a specific major version
        - Use https://unpkg.com/@vertigis/workflow-activities-exb/activitypack.json for the latest version (not recommended for production use)
        - Use https://localhost:5001/activitypack.json for a local development version
    - Title: Your desired title
    - Tags: Must include `geocortex-workflow-activity-pack`
1. Reload [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/)
1. The Experience Builder activities will now appear in the activity toolbox in an `Experience Builder` category

### Get selected features

Use **Get Selected Features** to retrieve the currently selected features from all feature-layer data sources in the Experience Builder app. It has no inputs and returns a `features` collection of ArcGIS graphics. Its runtime implementation is in the included [Workflow widget source](experience-builder-widget/README.md); copy that widget source into a compatible Experience Builder Developer Edition checkout and rebuild the client to use it.

## Development

This project was bootstrapped with the [VertiGIS Studio Workflow SDK](https://github.com/vertigis/vertigis-workflow-sdk). Before you can use your activity pack in the [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/), you will need to [register the activity pack](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode on port `5001`. Your activity pack will be available at [`https://localhost:5001/activitypack.json`](https://localhost:5001/activitypack.json), and the JavaScript bundle at [`https://localhost:5001/main.js`](https://localhost:5001/main.js). The HTTPS certificate of the development server is self-signed, so open [`https://localhost:5001/main.js`](https://localhost:5001/main.js) in a browser and allow the certificate warning. For creating a locally-trusted HTTPS certificate see the [Configuring a HTTPS Certificate](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#configuring-a-https-certificate) section on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/).

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#deployment) in the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/) for more information.

## Documentation

Find [further documentation on the SDK](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/) on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/)
