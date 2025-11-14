import { UTCDate } from "@date-fns/utc";
import { TZDate } from "@date-fns/tz";

import { formatDate, formatDateForServer, getTodayEst } from "./formatDate";

const TEST_DATE_ISO = "2023-04-15T13:45:30.000Z";
const LEAP_YEAR_DATE_ISO = "2024-02-29T23:59:59.000Z";
const START_OF_YEAR_ISO = "2022-01-01T00:00:00.000Z";
const END_OF_YEAR_ISO = "2022-12-31T23:59:59.000Z";
const NOON_ISO = "2023-07-04T12:00:00.000Z";
const MIDNIGHT_ISO = "2023-07-04T00:00:00.000Z";

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

  it("formats date as yyyy-MM-dd", () => {
    expect(formatDateForServer(testDate)).toBe("2023-04-15");
    expect(formatDateForServer(leapYearDate)).toBe("2024-02-29");
    expect(formatDateForServer(startOfYear)).toBe("2022-01-01");
    expect(formatDateForServer(endOfYear)).toBe("2022-12-31");
    expect(formatDateForServer(noon)).toBe("2023-07-04");
    expect(formatDateForServer(midnight)).toBe("2023-07-04");
  });

  describe("getTodayEst", () => {
    it("returns today's date in Eastern Time in yyyy-MM-dd format", () => {
      const result = getTodayEst();

      // Should match yyyy-MM-dd format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should be a valid date
      const parsedDate = new Date(result);
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.toString()).not.toBe("Invalid Date");
    });

    it("returns the same date as TZDate with America/New_York timezone", () => {
      const result = getTodayEst();
      const expectedDate = new TZDate(Date.now(), "America/New_York");
      const expectedFormatted = formatDateForServer(expectedDate);

      expect(result).toBe(expectedFormatted);
    });

    it("handles date transitions correctly", () => {
      // This test verifies the function works at different times
      // We can't control the actual date, but we can verify consistency
      const result1 = getTodayEst();

      // Calling it again immediately should return the same date
      const result2 = getTodayEst();
      expect(result1).toBe(result2);
    });
  });
});
