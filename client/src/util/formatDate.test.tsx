import { formatDate, formatDateTime, formatDateAsIsoString, parseInputDate } from "./formatDate";
import { UTCDate } from "@date-fns/utc";

// Test date constants as ISO strings
const TEST_DATE_ISO = "2023-04-15T13:45:30.000Z";
const LEAP_YEAR_DATE_ISO = "2024-02-29T23:59:59.000Z";
const START_OF_YEAR_ISO = "2022-01-01T00:00:00.000Z";
const END_OF_YEAR_ISO = "2022-12-31T23:59:59.000Z";
const NOON_ISO = "2023-07-04T12:00:00.000Z";
const MIDNIGHT_ISO = "2023-07-04T00:00:00.000Z";
const SINGLE_DIGIT_MONTH_DAY_ISO = "2023-03-05T07:08:09.000Z";
const UTC_TEST_DATE_ISO = "2023-01-02T00:00:00.000Z";

describe("formatDate utilities", () => {
  // Using UTCDate for timezone-independent test dates
  const testDate = new UTCDate(TEST_DATE_ISO);
  const leapYearDate = new UTCDate(LEAP_YEAR_DATE_ISO);
  const startOfYear = new UTCDate(START_OF_YEAR_ISO);
  const endOfYear = new UTCDate(END_OF_YEAR_ISO);
  const noon = new UTCDate(NOON_ISO);
  const midnight = new UTCDate(MIDNIGHT_ISO);

  it("formats date as MM/dd/yyyy", () => {
    expect(formatDate(testDate)).toBe("04/15/2023");
    expect(formatDate(leapYearDate)).toBe("02/29/2024");
    expect(formatDate(startOfYear)).toBe("01/01/2022");
    expect(formatDate(endOfYear)).toBe("12/31/2022");
    expect(formatDate(noon)).toBe("07/04/2023");
    expect(formatDate(midnight)).toBe("07/04/2023");
  });

  it("formatDateAsIsoString formats as ISO strings", () => {
    expect(formatDateAsIsoString(testDate)).toBe(TEST_DATE_ISO);
    expect(formatDateAsIsoString(leapYearDate)).toBe(LEAP_YEAR_DATE_ISO);
    expect(formatDateAsIsoString(startOfYear)).toBe(START_OF_YEAR_ISO);
    expect(formatDateAsIsoString(endOfYear)).toBe(END_OF_YEAR_ISO);
    expect(formatDateAsIsoString(noon)).toBe(NOON_ISO);
    expect(formatDateAsIsoString(midnight)).toBe(MIDNIGHT_ISO);
  });

  it("formats datetimes correctly with minute granularity", () => {
    expect(formatDateTime(testDate, "minute")).toBe("04/15/2023 13:45");
    expect(formatDateTime(leapYearDate, "minute")).toBe("02/29/2024 23:59");
    expect(formatDateTime(startOfYear, "minute")).toBe("01/01/2022 00:00");
  });

  it("formats datetimes correctly with second granularity", () => {
    expect(formatDateTime(testDate, "second")).toBe("04/15/2023 13:45:30");
    expect(formatDateTime(leapYearDate, "second")).toBe("02/29/2024 23:59:59");
    expect(formatDateTime(startOfYear, "second")).toBe("01/01/2022 00:00:00");
  });

  it("formats datetimes correctly with millisecond granularity", () => {
    expect(formatDateTime(testDate, "millisecond")).toBe("04/15/2023 13:45:30.000");
    expect(formatDateTime(leapYearDate, "millisecond")).toBe("02/29/2024 23:59:59.000");
    expect(formatDateTime(startOfYear, "millisecond")).toBe("01/01/2022 00:00:00.000");
  });

  it("handles single-digit months and days", () => {
    const singleDigitMonthDay = new UTCDate(SINGLE_DIGIT_MONTH_DAY_ISO);

    expect(formatDate(singleDigitMonthDay)).toBe("03/05/2023");
    expect(formatDateTime(singleDigitMonthDay, "minute")).toBe("03/05/2023 07:08");
  });

  it("displays UTC dates consistently", () => {
    const utcDate = new UTCDate(UTC_TEST_DATE_ISO); // Jan 2, 2023, 00:00:00 UTC

    // The rendered date should stay in UTC (not convert to local time)
    expect(formatDate(utcDate)).toBe("01/02/2023");
    expect(formatDateTime(utcDate, "minute")).toBe("01/02/2023 00:00");
  });

  it("parses date input strings with hyphens or slashes", () => {
    expect(parseInputDate("2025-09-26")?.toISOString()).toBe("2025-09-26T04:00:00.000Z");
    expect(parseInputDate("09/26/2025")?.toISOString()).toBe("2025-09-26T04:00:00.000Z");
    expect(parseInputDate(undefined)).toBeUndefined();
    expect(parseInputDate("not-a-date")).toBeUndefined();
  });
});
