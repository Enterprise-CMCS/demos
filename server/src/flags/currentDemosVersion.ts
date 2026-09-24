import type { DemosServerEnvironment } from "./demosEnvironments";
import { getCurrentEnvironment } from "./getCurrentEnvironment";
import type { DemosVersion } from "./demosVersions";

const versionNumbers: Record<DemosServerEnvironment, DemosVersion> = {
  local: "1.2.0",
  dev: "1.2.0",
  test: "1.2.0",
  impl: "1.1.0",
  prod: "1.1.0",
};
export const __DEMOS_VERSION__ = versionNumbers[getCurrentEnvironment()];
