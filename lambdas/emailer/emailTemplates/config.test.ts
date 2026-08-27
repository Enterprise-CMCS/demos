import { afterEach, describe, expect, it, vi } from "vitest";

import { demosAppUrls, getDemosAppUrl } from "./config";

describe("email template configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(Object.entries(demosAppUrls))(
    "uses the %s DEMOS URL",
    (environment, url) => {
      vi.stubEnv("DEMOS_ENVIRONMENT", environment);

      expect(getDemosAppUrl()).toBe(url);
    },
  );

  it("defaults to the local DEMOS URL", () => {
    vi.stubEnv("DEMOS_ENVIRONMENT", undefined);

    expect(getDemosAppUrl()).toBe("https://localhost:3000");
  });

  it("reports an unsupported environment", () => {
    vi.stubEnv("DEMOS_ENVIRONMENT", "staging");

    expect(() => getDemosAppUrl()).toThrow(
      "Unsupported DEMOS_ENVIRONMENT: staging",
    );
  });
});
