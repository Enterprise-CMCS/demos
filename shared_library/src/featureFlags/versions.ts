import { SemVer, valid, gte } from "semver";

/** Version assigned to each persistent environment. */
export const versionNumbers = {
  local: new SemVer("1.2.0"),
  dev: new SemVer("1.2.2"),
  test: new SemVer("1.2.0"),
  impl: new SemVer("1.1.0"),
  prod: new SemVer("1.1.0"),
} as const;

/** A configured persistent environment. */
export type DemosEnvironment = keyof typeof versionNumbers

/** Checks whether a string is a configured environment name. */
export function isDemosEnvironment(env: string): env is DemosEnvironment {
  return Object.hasOwn(versionNumbers, env)
}

/** A version and a release check bound to it. */
export interface ReleaseContext {
  readonly version: string;
  isReleased(minimumVersion: string): boolean;
}

/** Creates an immutable release context for a semantic version. */
function createReleaseContext(version:string): ReleaseContext {
  const parsedVersion = new SemVer(version).version

  return Object.freeze({
    version: parsedVersion,
    isReleased: (minimumVersion: string) => gte(parsedVersion, minimumVersion)
  })
}

/**
 * Creates a release context for an environment. This function is meant to be
 * called only from CDK code
 */
export function getEnvironmentRelease(environment: string, isEphemeral?: boolean): ReleaseContext {
  const version = getEnvironmentVersion(environment, isEphemeral)
  return createReleaseContext(version)
}

/**
 * Returns the version for an environment. Ephemeral environments use the
 * `dev` version.
 */
export function getEnvironmentVersion(environment: string, isEphemeral?: boolean): string {
  if (isEphemeral) {
    return versionNumbers.dev.version
  }

  if (!isDemosEnvironment(environment)) {
    throw new Error(`invalid value for environment: ${environment}`)
  }

  return versionNumbers[environment].version;
}

/**
 * Runtime version from `DEMOS_VERSION`, falling back to the `prod` version.
 */
const currentVersion = valid(process.env.DEMOS_VERSION ?? versionNumbers.prod)

if (!currentVersion) {
  throw new TypeError(
    `Invalid DEMOS_VERSION: ${process.env.DEMOS_VERSION}`,
  );
}

/** Release context for the current runtime. */
const runtimeRelease = createReleaseContext(currentVersion)

/** Returns the current runtime version. */
export function getVersionString(): string {
  return runtimeRelease.version;
}

/** Checks whether the runtime meets a minimum release version. */
export const isReleased = runtimeRelease.isReleased
