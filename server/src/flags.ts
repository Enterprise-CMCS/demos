import semver from "semver";
import { throwCustomGQLError } from "./errors/errorCodes";

/**
 * Feature flags and version constants.
 */

export const __DEMOS_VERSION__ = "1.1.0";

/**
 * Print version info on server startup.
 * This is used as a sentinel to demonstrate how these flags should be used
 * and should not be removed.
 */
export const __FEATURE_PRINT_VERSION__ = semver.gte(__DEMOS_VERSION__, "0.0.1");

/**
 * Use this function to throw when something is not yet implemented
 * but still reachable via API.
 */
export function throwNotReleasedError(apiEndpoint: string): never {
  throwCustomGQLError(
    `The query or mutator ${apiEndpoint} has not been released yet and cannot be used`,
    "NOT_RELEASED_ERROR"
  );
}

export const __FEATURE_APPROVE_TAG_API__ = semver.gte(__DEMOS_VERSION__, "1.2.0");
