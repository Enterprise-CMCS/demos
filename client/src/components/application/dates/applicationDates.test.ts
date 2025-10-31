import { describe, it, expect } from "vitest";
import {
  getStartOfDayEST,
  getEndOfDayEST,
  getNowEst,
  getDateFromApplicationDates,
  setDateInApplicationDates,
  hasDate,
  type ApplicationDate,
} from "./applicationDates";

// Mock data for testing
const mockApplicationDates: ApplicationDate[] = [
  {
    dateType: "Concept Start Date",
    dateValue: new Date("2025-01-01T05:00:00.000Z"), // 00:00 EST
  },
  {
    dateType: "Concept Completion Date",
    dateValue: new Date("2025-01-31T04:59:59.999Z"), // 23:59 EST
  },
  {
    dateType: "State Application Submitted Date",
    dateValue: new Date("2025-01-15T12:00:00.000Z"),
  },
  {
    dateType: "Application Intake Start Date",
    dateValue: new Date("2025-02-01T05:00:00.000Z"),
  },
];

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

  describe("Application date operations", () => {
    it("should get existing date from application dates", () => {
      const date = getDateFromApplicationDates(mockApplicationDates, "Concept Start Date");

      expect(date).toEqual(new Date("2025-01-01T05:00:00.000Z"));
    });

    it("should return null for non-existent date type", () => {
      const date = getDateFromApplicationDates(
        mockApplicationDates,
        "Federal Comment Period Start Date"
      );

      expect(date).toBeNull();
    });

    it("should update existing date in application dates", () => {
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      const updatedDates = setDateInApplicationDates(
        mockApplicationDates,
        "Concept Start Date",
        newDate
      );

      expect(updatedDates).toHaveLength(4);
      expect(updatedDates[0].dateValue).toEqual(newDate);
      expect(updatedDates[1].dateValue).toEqual(mockApplicationDates[1].dateValue); // unchanged
    });

    it("should add new date if it doesn't exist", () => {
      const newDate = new Date("2025-03-01T05:00:00.000Z");
      const updatedDates = setDateInApplicationDates(
        mockApplicationDates,
        "Completeness Start Date",
        newDate
      );

      expect(updatedDates).toHaveLength(5);
      expect(updatedDates[4].dateType).toBe("Completeness Start Date");
      expect(updatedDates[4].dateValue).toEqual(newDate);
    });

    it("should not modify original array when setting date", () => {
      const originalDates = [...mockApplicationDates];
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      setDateInApplicationDates(mockApplicationDates, "Concept Start Date", newDate);

      expect(mockApplicationDates).toEqual(originalDates);
    });

    it("should check if date exists", () => {
      expect(hasDate(mockApplicationDates, "Concept Start Date")).toBe(true);
      expect(hasDate(mockApplicationDates, "Federal Comment Period Start Date")).toBe(false);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty application dates array", () => {
      const emptyDates: ApplicationDate[] = [];

      const date = getDateFromApplicationDates(emptyDates, "Concept Start Date");
      expect(date).toBeNull();

      const updatedDates = setDateInApplicationDates(emptyDates, "Concept Start Date", new Date());
      expect(updatedDates).toHaveLength(1);

      expect(hasDate(emptyDates, "Concept Start Date")).toBe(false);
    });

    it("should maintain object structure when updating", () => {
      const newDate = new Date("2025-04-01T05:00:00.000Z");
      const updatedDates = setDateInApplicationDates(
        mockApplicationDates,
        "Concept Start Date",
        newDate
      );

      // Check that the structure is maintained
      expect(updatedDates[0]).toHaveProperty("dateType");
      expect(updatedDates[0]).toHaveProperty("dateValue");
      expect(updatedDates[0].dateType).toBe("Concept Start Date");
    });

    it("should not modify original array with immutable operations", () => {
      const originalDates = [...mockApplicationDates];

      setDateInApplicationDates(mockApplicationDates, "Concept Start Date", new Date());

      expect(mockApplicationDates).toEqual(originalDates);
    });
  });
});
