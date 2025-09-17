import { describe, it, expect } from "vitest";
import { getESTDate } from "./applicationDates";
import { formatDate, formatDateTime } from "util/formatDate";

const EPOCH_DATE = new Date(0); // January 1, 1970, 00:00:00 UTC

describe("applicationDates library", () => {
  it("provides a getESTDate() function that returns a date in EST timezone", () => {
    const estDate = getESTDate(EPOCH_DATE);
    expect(estDate.timeZone).toBe("America/New_York");
    expect(formatDate(estDate)).toBe("12/31/1969"); // EST is UTC-5, so date is Dec 31, 1969
    expect(formatDateTime(estDate)).toBe("12/31/1969 19:00"); // EST is UTC-5, so date is Dec 31, 1969
  });
});
