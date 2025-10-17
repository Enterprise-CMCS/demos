import { describe, it, expect } from "vitest";
import {
  getStartOfDayEST,
  getEndOfDayEST,
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
    dateType: "State Application Start Date",
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
