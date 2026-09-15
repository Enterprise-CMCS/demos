import semver from "semver";

/**
 * Build-time feature flags and version constants.
 */

export const __DEMOS_VERSION__ = "1.0.0";

/**
 * Print version info on server startup.
 * This is used as a sentinel to demonstrate how these flags should be used
 * and should not be removed.
 */
export const __FEATURE_PRINT_VERSION__ = semver.gte(__DEMOS_VERSION__, "0.0.1");
