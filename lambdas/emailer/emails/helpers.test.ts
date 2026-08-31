import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDate, getDemosAppUrl } from "./helpers";

describe("email helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured DEMOS application URL", () => {
    vi.stubEnv("DEMOS_APP_URL", "https://feature.dev.demos.internal.cms.gov");

    expect(getDemosAppUrl()).toBe(
      "https://feature.dev.demos.internal.cms.gov",
    );
  });

  it("defaults to the local DEMOS URL", () => {
    vi.stubEnv("DEMOS_APP_URL", undefined);

    expect(getDemosAppUrl()).toBe("https://localhost:3000");
  });

  it.each([
    ["EDT", "2026-10-01T03:59:59.999Z", "2026-09-30"],
    ["EST", "2027-01-01T04:59:59.999Z", "2026-12-31"],
  ])(
    "formats an end-of-day %s timestamp as an Eastern date",
    (_, value, expected) => {
      expect(formatDate(value)).toBe(expected);
    },
  );

  it("reports an invalid email date", () => {
    expect(() => formatDate("not-a-date")).toThrow(
      "Invalid email date value: not-a-date",
    );
  });
});
