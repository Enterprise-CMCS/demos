import semver, { SemVer } from "semver";

export type DemosServerFeatureFlag = "printVersion" | "approveTagApi";
export type DemosServerFeatureFlagSetting = Record<DemosServerFeatureFlag, boolean>;

// This function exists to enable easier dependency injections
// Feature flags are added here
export function getFeatureFlags(currentVersion: SemVer): DemosServerFeatureFlagSetting {
  return {
    printVersion: semver.gte(currentVersion, "0.0.1"),
    approveTagApi: semver.gte(currentVersion, "1.2.0"),
  };
}
