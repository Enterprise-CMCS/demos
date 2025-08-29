export const BUNDLE_TYPE = {
  DEMONSTRATION: "DEMONSTRATION",
  AMENDMENT: "AMENDMENT",
  EXTENSION: "EXTENSION",
} as const;

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];
