import semver from "semver";

/**
 * Build-time feature flags and version constants.
 * Used in both local development (tsx) and production builds (esbuild).
 */

export const __DEMOS_VERSION__ = "1.0.0";

/**
 * Print version info on server startup.
 * Enabled when version > 0.0.1
 */
export const __FEATURE_PRINT_VERSION__ = semver.gt(__DEMOS_VERSION__, "0.0.1");
