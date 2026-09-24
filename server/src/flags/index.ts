// Functions
export { getFeatureFlags } from "./getFeatureFlags";
export { throwApiNotReleasedError } from "./throwApiNotReleasedError";

// Server Versions and Environments
export const DEMOS_SERVER_ENVIRONMENTS = ["local", "dev", "test", "impl", "prod"] as const;
export type DemosServerEnvironment = (typeof DEMOS_SERVER_ENVIRONMENTS)[number];

export function isDemosServerEnvironment(value: string): value is DemosServerEnvironment {
  return DEMOS_SERVER_ENVIRONMENTS.includes(value as DemosServerEnvironment);
}

export const DEMOS_VERSIONS = ["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.1.0", "1.2.0"] as const;
export type DemosVersion = (typeof DEMOS_VERSIONS)[number];

// Current version determination
import { getCurrentEnvironment } from "./getCurrentEnvironment";

const versionNumbers: Record<DemosServerEnvironment, DemosVersion> = {
  local: "1.2.0",
  dev: "1.2.0",
  test: "1.2.0",
  impl: "1.1.0",
  prod: "1.1.0",
};
export const __DEMOS_VERSION__ = versionNumbers[getCurrentEnvironment()];
