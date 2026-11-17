export const EXB_ACTIVITY_PACK_UUID =
    "uuid:0790222e-6d41-4410-a391-af04e8b5ae5b";

// List of custom activity packs that come pre-installed with exb.
export const localCustomActivityPackSuites = [EXB_ACTIVITY_PACK_UUID];

export const localCustomActivityPacks = {
    [`${EXB_ACTIVITY_PACK_UUID}::ClearSelectedFeatures`]: [
        {
            export: "ClearSelectedFeatures",
            suite: EXB_ACTIVITY_PACK_UUID,
            path: EXB_ACTIVITY_PACK_UUID,
            import: () => import("./exb/ClearSelectedFeatures"),
        },
    ],
    [`${EXB_ACTIVITY_PACK_UUID}::CloseWidget`]: [
        {
            export: "CloseWidget",
            suite: EXB_ACTIVITY_PACK_UUID,
            path: EXB_ACTIVITY_PACK_UUID,
            import: () => import("./exb/CloseWidget"),
        },
    ],
    [`${EXB_ACTIVITY_PACK_UUID}::GetSelectedFeatures`]: [
        {
            export: "GetSelectedFeatures",
            suite: EXB_ACTIVITY_PACK_UUID,
            path: EXB_ACTIVITY_PACK_UUID,
            import: () => import("./exb/GetSelectedFeatures"),
        },
    ],
    [`${EXB_ACTIVITY_PACK_UUID}::OpenWidget`]: [
        {
            export: "OpenWidget",
            suite: EXB_ACTIVITY_PACK_UUID,
            path: EXB_ACTIVITY_PACK_UUID,
            import: () => import("./exb/OpenWidget"),
        },
    ],
    [`${EXB_ACTIVITY_PACK_UUID}::SelectFeatures`]: [
        {
            export: "SelectFeatures",
            suite: EXB_ACTIVITY_PACK_UUID,
            path: EXB_ACTIVITY_PACK_UUID,
            import: () => import("./exb/SelectFeatures"),
        },
    ],
};
