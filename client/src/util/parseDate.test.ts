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

  describe("Date-only parsing", () => {
    it("parses first day of month", () => {
      const result = parseInputDate("2023-05-01");
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4); // May = 4 (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it("parses last day of month (30 days)", () => {
      const result = parseInputDate("2023-06-30");
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5); // June = 5
      expect(result.getDate()).toBe(30);
    });

    it("parses last day of month (31 days)", () => {
      const result = parseInputDate("2023-07-31");
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(6); // July = 6
      expect(result.getDate()).toBe(31);
    });

    it("parses February 28 in non-leap year", () => {
      const result = parseInputDate("2023-02-28");
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(1); // February = 1
      expect(result.getDate()).toBe(28);
    });

    it("parses February 29 in leap year", () => {
      const result = parseInputDate("2024-02-29");
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(29);
    });

    it("parses dates from different decades", () => {
      const result1990 = parseInputDate("1990-12-25");
      const result2000 = parseInputDate("2000-01-01");
      const result2020 = parseInputDate("2020-08-15");

      expect(result1990.getFullYear()).toBe(1990);
      expect(result2000.getFullYear()).toBe(2000);
      expect(result2020.getFullYear()).toBe(2020);
    });

    it("treats date-only strings as local timezone", () => {
      const result = parseInputDate("2023-06-15");
      // Date-only strings are parsed in local time, not UTC
      // The exact hour depends on the local timezone
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });
  });
});
