export const DEMOS_VERSIONS = ["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.1.0", "1.2.0"] as const;
export type DemosVersion = (typeof DEMOS_VERSIONS)[number];
