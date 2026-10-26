// Vitest and other helpers
import { describe, it, expect } from "vitest";
import {
  getEasternNow,
  isLocalDate,
  parseDateTimeOrLocalDateToEasternTZDate,
} from "./dateUtilities";

// Types
import type { EasternTZDate } from "./dateUtilities";

// Functions under test
import { FEDERAL_HOLIDAYS } from "./constants";

// Mocks

describe("constants", () => {
  describe("FEDERAL_HOLIDAYS", () => {
    const federalHolidays: EasternTZDate[] = [];
    for (const holiday of FEDERAL_HOLIDAYS) {
      if (isLocalDate(holiday)) {
        federalHolidays.push(parseDateTimeOrLocalDateToEasternTZDate(holiday, "Start of Day"));
      } else {
        throw new Error("Invalid LocalDate found in the FEDERAL_HOLIDAYS constant!");
      }
    }
    it("should have federal holidays for at least the next two years", () => {
      const currentYear = getEasternNow()["Start of Day"].easternTZDate.getFullYear();
      const highestHolidayYear = Math.max(
        ...federalHolidays.map((holiday) => holiday.easternTZDate.getFullYear())
      );
      expect(highestHolidayYear - currentYear).toBeGreaterThan(1);
    });
  });
});
