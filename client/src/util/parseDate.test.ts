import { UTCDate } from "@date-fns/utc";

import { parseInputDate } from "./parseDate";

const TEST_DATE_ISO = "2023-04-15T13:45:30.000Z";
const START_OF_YEAR_ISO = "2022-01-01T00:00:00.000Z";
const END_OF_YEAR_ISO = "2022-12-31T23:59:59.000Z";

describe("parseInputDate", () => {
  it("parses ISO 8601 date strings with full timestamp", () => {
    const result = parseInputDate(TEST_DATE_ISO);
    expect(result).toEqual(new Date(TEST_DATE_ISO));
  });

  it("parses date-only strings (yyyy-MM-dd)", () => {
    const result = parseInputDate("2023-04-15");
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(3); // April = 3 (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it("parses leap year dates", () => {
    const result = parseInputDate("2024-02-29");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // February = 1
    expect(result.getDate()).toBe(29);
  });

  it("parses start of year", () => {
    const result = parseInputDate(START_OF_YEAR_ISO);
    expect(result).toEqual(new Date(START_OF_YEAR_ISO));
  });

  it("parses end of year", () => {
    const result = parseInputDate(END_OF_YEAR_ISO);
    expect(result).toEqual(new Date(END_OF_YEAR_ISO));
  });

  it("preserves time information from ISO strings", () => {
    const result = parseInputDate(TEST_DATE_ISO);
    const expected = new UTCDate(TEST_DATE_ISO);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("handles midnight correctly", () => {
    const result = parseInputDate("2023-07-04T00:00:00.000Z");
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });

  it("handles noon correctly", () => {
    const result = parseInputDate("2023-07-04T12:00:00.000Z");
    expect(result.getUTCHours()).toBe(12);
    expect(result.getUTCMinutes()).toBe(0);
  });
});
