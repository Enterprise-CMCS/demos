import semver from "semver";
import type { DemosVersion } from ".";

export type DemosServerFeatureFlag = "printVersion" | "approveTagApi";
export type DemosServerFeatureFlagSetting = Record<DemosServerFeatureFlag, boolean>;

// This function exists to enable easier dependency injections
// Feature flags are added here
export function getFeatureFlags(currentVersion: DemosVersion): DemosServerFeatureFlagSetting {
  return {
    printVersion: semver.gte(currentVersion, "0.0.1"),
    approveTagApi: semver.gte(currentVersion, "1.2.0"),
  };
}
