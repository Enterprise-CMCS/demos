import { describe, it, expect } from "vitest";
import { getStartOfDayEST, getEndOfDayEST, getNowEst } from "./applicationDates";

describe("applicationDates", () => {
  describe("Date creation functions", () => {
    it("should create start of day EST date", () => {
      const startDate = getStartOfDayEST(2025, 0, 1); // January 1, 2025

      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getMonth()).toBe(0);
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);
      expect(startDate.timeZone).toBe("America/New_York");
    });

    it("should create end of day EST date", () => {
      const endDate = getEndOfDayEST(2025, 0, 1); // January 1, 2025

      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getDate()).toBe(1);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
      expect(endDate.getMilliseconds()).toBe(999);
      expect(endDate.timeZone).toBe("America/New_York");
    });

    it("should get today's date in EST timezone", () => {
      const today = getNowEst();

      // Should be a TZDate with America/New_York timezone
      expect(today.timeZone).toBe("America/New_York");

      // Should be a valid date
      expect(today instanceof Date).toBe(true);
      expect(isNaN(today.getTime())).toBe(false);
    });

    it("should get today's date with current time", () => {
      const before = Date.now();
      const today = getNowEst();
      const after = Date.now();

      // The timestamp should be between before and after
      const todayTime = today.getTime();
      expect(todayTime).toBeGreaterThanOrEqual(before);
      expect(todayTime).toBeLessThanOrEqual(after);
    });

    it("should create new instance on each call", () => {
      const today1 = getNowEst();
      const today2 = getNowEst();

      // Should be different instances
      expect(today1).not.toBe(today2);

      // But should be very close in time (within a second)
      expect(Math.abs(today1.getTime() - today2.getTime())).toBeLessThan(1000);
    });

    it("should handle daylight saving time transitions", () => {
      // getTodayEst should always use America/New_York timezone
      // which automatically handles DST
      const today = getNowEst();

      // Verify it's using the correct timezone
      expect(today.timeZone).toBe("America/New_York");

      // The offset should be either -5 (EST) or -4 (EDT) hours from UTC
      const offsetHours = -today.getTimezoneOffset() / 60;
      expect([-4, -5]).toContain(offsetHours);
    });
  });
});
