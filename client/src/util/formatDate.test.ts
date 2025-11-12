import { UTCDate } from "@date-fns/utc";

import { formatDate, formatDateForServer } from "./formatDate";

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
});
