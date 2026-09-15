import * as esbuild from "esbuild";
import semver from "semver";

/**
 * Build script for the server.
 * Uses esbuild's JavaScript API to inject feature flags via the define option.
 * Keep these constants in sync with build.d.ts type declarations.
 */

const DEMOS_VERSION = "1.0.0";

await esbuild.build({
  entryPoints: ["dist/server.js"],
  bundle: true,
  platform: "node",
  outfile: "build/server.cjs",
  minify: true,
  external: ["@yaacovcr/transform"],
  define: {
    __DEMOS_VERSION__: JSON.stringify(DEMOS_VERSION),
    __FEATURE_PRINT_VERSION__: String(semver.gt(DEMOS_VERSION, "0.0.1")),
  },
});
