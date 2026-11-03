import { describe, it, expect, vi } from "vitest";
import { isDemosEnvironment, versionNumbers } from "./versions.js";

describe("isDemosEnvironment", () => {
  it("should return true for a valid environment", () => {
    expect(isDemosEnvironment("prod")).toEqual(true)
    expect(isDemosEnvironment("impl")).toEqual(true)
    expect(isDemosEnvironment("test")).toEqual(true)
    expect(isDemosEnvironment("dev")).toEqual(true)
    expect(isDemosEnvironment("local")).toEqual(true)
  })
  it("should return false for an invalid environment", () => {
    expect(isDemosEnvironment("unit-test")).toEqual(false)
  })
})

describe("getVersionString", () => {
  it("should return the proper versions string", async () => {
    vi.stubEnv("DEMOS_VERSION", "3.2.1");
    vi.resetModules();
    const { getVersionString } = await import("./versions.js");
    expect(getVersionString()).toEqual("3.2.1")
    
    vi.stubEnv("DEMOS_VERSION", "5.5.1");
    vi.resetModules();
    const { getVersionString: getVersionStringSecond } = await import("./versions.js");
    expect(getVersionStringSecond()).toEqual("5.5.1")
  })
})

describe("getEnvironmentRelease", () => {
  it("should return a context with frozen version", async () => {
    vi.stubEnv("DEMOS_VERSION", "1.0.0");
    vi.resetModules()
    const { getEnvironmentRelease } = await import("./versions.js");
    
    const ctx = getEnvironmentRelease("dev", false)

    expect(ctx.version).toEqual(versionNumbers.dev.version)
    expect(ctx.version).not.toEqual("1.0.0")

    // @ts-expect-error
    expect(() => ctx.version = "1.0.0").to.Throw()

    const ctxTest = getEnvironmentRelease("test", false)
    expect(ctxTest.version).toEqual(versionNumbers.test.version)
    expect(ctxTest.version).not.toEqual("1.0.0")
 
    const cdxImpl = getEnvironmentRelease("impl", false)
    expect(cdxImpl.version).toEqual(versionNumbers.impl.version)
    expect(cdxImpl.version).not.toEqual("1.0.0")

    const cdxProd = getEnvironmentRelease("prod", false)
    expect(cdxProd.version).toEqual(versionNumbers.prod.version)
    expect(cdxProd.version).not.toEqual("1.0.0")

  })

  it("should properly compare versions from env context", async () => {
    const { getEnvironmentRelease } = await import("./versions.js");
    const ctx = getEnvironmentRelease("dev")

    const higherVersion = "10.0.0"
    const lowerVersion = "0.0.1"

    expect(ctx.isReleased(higherVersion)).toEqual(false)
    expect(ctx.isReleased(lowerVersion)).toEqual(true)

  })
})

describe("getEnvironmentVersion", () => {
  it("should return the dev version for an ephemeral environment", async () => {
    const { getEnvironmentVersion } = await import("./versions.js");

    const version = getEnvironmentVersion("unit-test", true);
    expect(version).toEqual(versionNumbers.dev.version)
  })

  it("should throw if the environment is invalid", async () => {
    const { getEnvironmentVersion } = await import("./versions.js");
    expect(() => getEnvironmentVersion("unit-test", false)).to.Throw("invalid value for environment: unit-test");
  })

  it("should return the proper version for each environment", async () => {
    const { getEnvironmentVersion } = await import("./versions.js");
    expect(getEnvironmentVersion("dev", false)).toEqual(versionNumbers.dev.version)
    expect(getEnvironmentVersion("test", false)).toEqual(versionNumbers.test.version)
    expect(getEnvironmentVersion("impl", false)).toEqual(versionNumbers.impl.version)
    expect(getEnvironmentVersion("prod", false)).toEqual(versionNumbers.prod.version)
  })

});

describe("runtime versions", () => {
  it("should properly resolve isReleased based on version environment variable", async () => {
    vi.stubEnv("DEMOS_VERSION", "1.0.0");
    vi.resetModules()
    const { isReleased } = await import("./versions.js");

    expect(isReleased("1.0.0")).toEqual(true)
    expect(isReleased("1.0.1")).toEqual(false)
    expect(isReleased("0.1.0")).toEqual(true)

  })

  it("should throw an error if the demos version is invalid", async () => {
    vi.stubEnv("DEMOS_VERSION", "not-a-version");
    vi.resetModules()
    await expect(import("./versions.js")).rejects.toThrow("Invalid DEMOS_VERSION: not-a-version");

  })

})
