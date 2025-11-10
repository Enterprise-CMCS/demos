import { UTCDate } from "@date-fns/utc";

import {
  formatDate,
  formatDateAsIsoString,
  formatDateTime,
  safeDateFormat,
  formatEndOfDayESTDate,
  formatEndOfDayESTForInput,
} from "./formatDate";

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
    const utcDate = new UTCDate(UTC_TEST_DATE_ISO);
    expect(formatDate(utcDate)).toBe("01/02/2023");
    expect(formatDateTime(utcDate, "minute")).toBe("01/02/2023 00:00");
  });

  describe("safeDateFormat", () => {
    it("formats Date objects correctly", () => {
      const testDate = new UTCDate(TEST_DATE_ISO);
      expect(safeDateFormat(testDate)).toBe("04/15/2023");
    });

    it("formats ISO string dates correctly", () => {
      expect(safeDateFormat(TEST_DATE_ISO)).toBe("04/15/2023");
      expect(safeDateFormat("2024-02-29T23:59:59.000Z")).toBe("02/29/2024");
      expect(safeDateFormat("2022-01-01T00:00:00.000Z")).toBe("01/01/2022");
    });

    it("handles null and undefined values", () => {
      expect(safeDateFormat(null)).toBe("--/--/----");
      expect(safeDateFormat(undefined)).toBe("--/--/----");
    });

    it("handles invalid date strings", () => {
      expect(safeDateFormat("invalid-date")).toBe("--/--/----");
      expect(safeDateFormat("")).toBe("--/--/----");
      expect(safeDateFormat("not-a-date")).toBe("--/--/----");
    });

    it("handles single-digit months and days in ISO strings", () => {
      expect(safeDateFormat("2023-03-05T07:08:09.000Z")).toBe("03/05/2023");
      expect(safeDateFormat("2023-12-01T00:00:00.000Z")).toBe("12/01/2023");
    });
  });

  describe("formatEndOfDayESTDate", () => {
    it("formats end-of-day EST dates correctly from UTC strings", () => {
      expect(formatEndOfDayESTDate("2026-09-06T03:59:59.999Z")).toBe("09/05/2026");
      expect(formatEndOfDayESTDate("2026-03-06T04:59:59.999Z")).toBe("03/05/2026");
    });

    it("formats Date objects correctly", () => {
      const endOfDayEST = new UTCDate("2026-09-06T03:59:59.999Z");
      expect(formatEndOfDayESTDate(endOfDayEST)).toBe("09/05/2026");
    });

    it("handles null and undefined values", () => {
      expect(formatEndOfDayESTDate(null)).toBe("--/--/----");
      expect(formatEndOfDayESTDate(undefined)).toBe("--/--/----");
    });

    it("handles invalid date strings", () => {
      expect(formatEndOfDayESTDate("invalid-date")).toBe("--/--/----");
      expect(formatEndOfDayESTDate("")).toBe("--/--/----");
    });
  });

  describe("formatEndOfDayESTForInput", () => {
    it("formats end-of-day EST dates for input fields", () => {
      expect(formatEndOfDayESTForInput("2026-09-06T03:59:59.999Z")).toBe("2026-09-05");
      expect(formatEndOfDayESTForInput("2026-03-06T04:59:59.999Z")).toBe("2026-03-05");
    });

    it("formats Date objects correctly for input", () => {
      const endOfDayEST = new UTCDate("2026-09-06T03:59:59.999Z");
      expect(formatEndOfDayESTForInput(endOfDayEST)).toBe("2026-09-05");
    });

    it("handles null and undefined values", () => {
      expect(formatEndOfDayESTForInput(null)).toBe("");
      expect(formatEndOfDayESTForInput(undefined)).toBe("");
    });

    it("handles invalid date strings", () => {
      expect(formatEndOfDayESTForInput("invalid-date")).toBe("");
      expect(formatEndOfDayESTForInput("")).toBe("");
    });
  });
});
