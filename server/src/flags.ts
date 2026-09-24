import semver from "semver";
import { throwCustomGQLError } from "./errors/errorCodes";

// Determine running environment to allow different version numbers
const ENVIRONMENTS = ["local", "dev", "test", "impl", "prod"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

function isEnvironment(value: string): value is Environment {
  return ENVIRONMENTS.includes(value as Environment);
}
function getCurrentEnvironment(): Environment {
  const currentEnv = process.env.CURRENT_ENV;
  if (!currentEnv) {
    return "prod";
  } else if (!isEnvironment(currentEnv)) {
    throw new Error(`Invalid value for CURRENT_ENV: ${currentEnv}`);
  }
  return currentEnv;
}

const versionNumbers: Record<Environment, string> = {
  local: "1.2.0",
  dev: "1.2.0",
  test: "1.2.0",
  impl: "1.1.0",
  prod: "1.1.0",
};
export const __DEMOS_VERSION__ = versionNumbers[getCurrentEnvironment()];

// Use this function to throw when using an API that is not yet released
export function throwApiNotReleasedError(apiName: string): never {
  throwCustomGQLError(
    `The query or mutator ${apiName} has not been released yet and cannot be used`,
    "NOT_RELEASED_ERROR"
  );
}

/**
 * Print version info on server startup.
 * This is used as a sentinel to demonstrate how these flags should be used
 * and should not be removed.
 */
export const __FEATURE_PRINT_VERSION__ = semver.gte(__DEMOS_VERSION__, "0.0.1");

// Feature flags begin here
export const __FEATURE_APPROVE_TAG_API__ = semver.gte(__DEMOS_VERSION__, "1.2.0");
