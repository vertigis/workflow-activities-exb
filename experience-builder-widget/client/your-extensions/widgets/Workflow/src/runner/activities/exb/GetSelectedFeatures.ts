import {
    type EmptyInputs,
    type IActivityContext,
    type IActivityHandler,
} from "@vertigis/workflow/IActivityHandler";
import type Graphic from "esri/Graphic";
import {
    DataSourceManager,
    type FeatureDataRecord,
    type FeatureLayerDataSource,
} from "jimu-core";
import { EXB_ACTIVITY_PACK_UUID } from "../customActivityPackManifest";
import { assertSelectionSupported } from "../exbSelection";

interface GetSelectedFeaturesOutputs {
    features: Graphic[];
}

export class GetSelectedFeatures implements IActivityHandler {
    static readonly action = `${EXB_ACTIVITY_PACK_UUID}::GetSelectedFeatures`;

    static readonly suite = EXB_ACTIVITY_PACK_UUID;

    async execute(
        _inputs: EmptyInputs,
        context: IActivityContext,
    ): Promise<GetSelectedFeaturesOutputs> {
        assertSelectionSupported(context, "Get Selected Features");

        const dataSources = DataSourceManager.getInstance().getDataSources();
        const seen = new Set<string>();
        const featurePromises: Array<Promise<Graphic>> = [];

        for (const dataSource of Object.values(dataSources)) {
            if (dataSource.type !== "FEATURE_LAYER") {
                continue;
            }

            const featureDataSource = dataSource as FeatureLayerDataSource;
            const mainDataSourceId = featureDataSource.getMainDataSource().id;
            const selectedRecords =
                featureDataSource.getSelectedRecords() as FeatureDataRecord[];

            for (const record of selectedRecords) {
                const key = `${mainDataSourceId}:${record.getId()}`;
                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                featurePromises.push(record.getJSAPIGraphic());
            }
        }

        return { features: await Promise.all(featurePromises) };
    }
}
