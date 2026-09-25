import { SemVer } from "semver";
import type { DemosServerEnvironment } from "./demosEnvironments";
import { getCurrentEnvironment } from "./getCurrentEnvironment";

const versionNumbers: Record<DemosServerEnvironment, SemVer> = {
  local: new SemVer("1.2.0"),
  dev: new SemVer("1.2.0"),
  test: new SemVer("1.2.0"),
  impl: new SemVer("1.1.0"),
  prod: new SemVer("1.1.0"),
};
export const __DEMOS_VERSION__ = versionNumbers[getCurrentEnvironment()];
