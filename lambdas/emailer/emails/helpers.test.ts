import { afterEach, describe, expect, it, vi } from "vitest";

import { getDemosAppUrl } from "./helpers";

const expectedUrls = {
  local: "https://localhost:3000",
  dev: "https://dev.demos.internal.cms.gov",
  test: "https://test.demos.internal.cms.gov",
  impl: "https://impl.demos.internal.cms.gov",
  prod: "https://demos.cms.gov",
};

describe("email helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(Object.entries(expectedUrls))(
    "uses the %s DEMOS URL",
    (environment, url) => {
      vi.stubEnv("STAGE", environment);

      expect(getDemosAppUrl()).toBe(url);
    },
  );

  it("defaults to the local DEMOS URL", () => {
    vi.stubEnv("STAGE", undefined);

    expect(getDemosAppUrl()).toBe("https://localhost:3000");
  });

  it("reports an unsupported environment", () => {
    vi.stubEnv("STAGE", "staging");

    expect(() => getDemosAppUrl()).toThrow(
      "Unsupported email STAGE: staging",
    );
  });
});
