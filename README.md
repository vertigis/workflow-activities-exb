# Experience Builder Activities

[![CI/CD](https://github.com/vertigis/workflow-activities-exb/workflows/CI/CD/badge.svg)](https://github.com/vertigis/workflow-activities-exb/actions)
[![npm](https://img.shields.io/npm/v/@vertigis/workflow-activities-exb)](https://www.npmjs.com/package/@vertigis/workflow-activities-exb)

This project contains activities to perform [ArcGIS Experience Builder](https://www.esri.com/en-us/arcgis/products/arcgis-experience-builder/overview) specific actions in a [VertiGIS Studio Workflow](https://www.vertigisstudio.com/products/vertigis-studio-workflow/).

Note: this activity pack contains only activity definitions. The activity implementations are provided by the VertiGIS Studio Workflow widget for Experience Builder.

## Requirements

### VertiGIS Studio Workflow Versions

The Experience Builder activities are designed to work with VertiGIS Studio Workflow versions `5.33` and above.

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
        - Use https://unpkg.com/@vertigis/workflow-activities-exb/activitypack.json for the latest version
        - Use https://unpkg.com/@vertigis/workflow-activities-exb@1.0.0/activitypack.json for a specific version
        - Use https://localhost:5000/activitypack.json for a local development version
    - Title: Your desired title
    - Tags: Must include `geocortex-workflow-activity-pack`
1. Reload [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/)
1. The Experience Builder activities will now appear in the activity toolbox in an `Experience Builder` category

## Development

This project was bootstrapped with the [VertiGIS Studio Workflow SDK](https://github.com/vertigis/vertigis-workflow-sdk). Before you can use your activity pack in the [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/), you will need to [register the activity pack](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode. Your activity pack will be available at [http://localhost:5000/main.js](http://localhost:5000/main.js). The HTTPS certificate of the development server is a self-signed certificate that web browsers will warn about. To work around this open [`https://localhost:5000/main.js`](https://localhost:5000/main.js) in a web browser and allow the invalid certificate as an exception. For creating a locally-trusted HTTPS certificate see the [Configuring a HTTPS Certificate](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#configuring-a-https-certificate) section on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/).

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#deployment) in the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/) for more information.

## Documentation

Find [further documentation on the SDK](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/) on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/)
