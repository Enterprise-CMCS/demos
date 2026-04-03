import { describe, expect, it } from "vitest";

import { getOptionsForYearSelect } from "./QuarterlyDeliverableSchedule";

describe("getOptionsForYearSelect", () => {
  it("returns a single year option when dates are in the same calendar year", () => {
    const result = getOptionsForYearSelect(new Date("2026-01-01"), new Date("2026-12-31"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns inclusive year options across calendar years", () => {
    const result = getOptionsForYearSelect(new Date("2024-01-01"), new Date("2026-12-31"));

    expect(result).toEqual([
      { label: "Year 1", value: "1" },
      { label: "Year 2", value: "2" },
      { label: "Year 3", value: "3" },
    ]);
  });

  it("returns at least one option when expiration is before effective date", () => {
    const result = getOptionsForYearSelect(new Date("2026-12-31"), new Date("2026-01-01"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when effective date is undefined", () => {
    const result = getOptionsForYearSelect(undefined, new Date("2026-12-31"));

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when expiration date is undefined", () => {
    const result = getOptionsForYearSelect(new Date("2026-01-01"), undefined);

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });

  it("returns a single year option when both dates are undefined", () => {
    const result = getOptionsForYearSelect(undefined, undefined);

    expect(result).toEqual([{ label: "Year 1", value: "1" }]);
  });
});
