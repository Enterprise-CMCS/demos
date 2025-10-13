import { describe, it, expect } from "vitest";
import {
  getStartOfDayEST,
  getEndOfDayEST,
  getStatusForPhase,
  setStatusForPhase,
  getDateFromBundleDates,
  setDateInBundleDates,
  removeDateFromBundleDates,
  hasDate,
  getDatesByPrefix,
  type SimplePhase,
  type SimpleBundleDate,
} from "./bundleDates";

// Mock data for testing
const mockBundleDates: SimpleBundleDate[] = [
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

const mockBundlePhases: SimplePhase[] = [
  {
    phaseName: "Concept",
    phaseStatus: "Started",
  },
  {
    phaseName: "State Application",
    phaseStatus: "Not Started",
  },
  {
    phaseName: "Completeness",
    phaseStatus: "Not Started",
  },
];

describe("phaseDates", () => {
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

  describe("Phase status operations", () => {
    it("should get status for existing phase", () => {
      const status = getStatusForPhase(mockBundlePhases, "Concept");
      expect(status).toBe("Started");
    });

    it("should get status for different phase", () => {
      const status = getStatusForPhase(mockBundlePhases, "State Application");
      expect(status).toBe("Not Started");
    });

    it("should return null for non-existent phase", () => {
      const status = getStatusForPhase(mockBundlePhases, "None");
      expect(status).toBeNull();
    });

    it("should set status for existing phase", () => {
      const updatedPhases = setStatusForPhase(mockBundlePhases, "Concept", "Completed");

      expect(updatedPhases).toHaveLength(3);
      expect(updatedPhases[0].phaseStatus).toBe("Completed");
      expect(updatedPhases[1].phaseStatus).toBe("Not Started"); // unchanged
      expect(updatedPhases[2].phaseStatus).toBe("Not Started"); // unchanged
    });

    it("should not modify original array when setting status", () => {
      const originalPhases = [...mockBundlePhases];
      setStatusForPhase(mockBundlePhases, "Concept", "Completed");

      expect(mockBundlePhases).toEqual(originalPhases);
    });

    it("should return unchanged array when setting status for non-existent phase", () => {
      const updatedPhases = setStatusForPhase(mockBundlePhases, "None", "Completed");

      expect(updatedPhases).toEqual(mockBundlePhases);
    });
  });

  describe("Bundle date operations", () => {
    it("should get existing date from bundle dates", () => {
      const date = getDateFromBundleDates(mockBundleDates, "Concept Start Date");

      expect(date).toEqual(new Date("2025-01-01T05:00:00.000Z"));
    });

    it("should return null for non-existent date type", () => {
      const date = getDateFromBundleDates(mockBundleDates, "Federal Comment Period Start Date");

      expect(date).toBeNull();
    });

    it("should update existing date in bundle dates", () => {
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      const updatedDates = setDateInBundleDates(mockBundleDates, "Concept Start Date", newDate);

      expect(updatedDates).toHaveLength(4);
      expect(updatedDates[0].dateValue).toEqual(newDate);
      expect(updatedDates[1].dateValue).toEqual(mockBundleDates[1].dateValue); // unchanged
    });

    it("should add new date if it doesn't exist", () => {
      const newDate = new Date("2025-03-01T05:00:00.000Z");
      const updatedDates = setDateInBundleDates(
        mockBundleDates,
        "Completeness Start Date",
        newDate
      );

      expect(updatedDates).toHaveLength(5);
      expect(updatedDates[4].dateType).toBe("Completeness Start Date");
      expect(updatedDates[4].dateValue).toEqual(newDate);
    });

    it("should not modify original array when setting date", () => {
      const originalDates = [...mockBundleDates];
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      setDateInBundleDates(mockBundleDates, "Concept Start Date", newDate);

      expect(mockBundleDates).toEqual(originalDates);
    });

    it("should remove date from bundle dates", () => {
      const updatedDates = removeDateFromBundleDates(mockBundleDates, "Concept Start Date");

      expect(updatedDates).toHaveLength(3);
      expect(updatedDates.find((d) => d.dateType === "Concept Start Date")).toBeUndefined();
    });

    it("should return unchanged array when removing non-existent date", () => {
      const updatedDates = removeDateFromBundleDates(
        mockBundleDates,
        "Federal Comment Period Start Date"
      );

      expect(updatedDates).toHaveLength(4);
      expect(updatedDates).toEqual(mockBundleDates);
    });

    it("should check if date exists", () => {
      expect(hasDate(mockBundleDates, "Concept Start Date")).toBe(true);
      expect(hasDate(mockBundleDates, "Federal Comment Period Start Date")).toBe(false);
    });

    it("should get dates by prefix", () => {
      const conceptDates = getDatesByPrefix(mockBundleDates, "Concept");

      expect(conceptDates).toHaveLength(2);
      expect(conceptDates[0].dateType).toBe("Concept Start Date");
      expect(conceptDates[1].dateType).toBe("Concept Completion Date");
    });

    it("should get dates by different prefix", () => {
      const stateAppDates = getDatesByPrefix(mockBundleDates, "State Application");

      expect(stateAppDates).toHaveLength(2);
      expect(stateAppDates[0].dateType).toBe("State Application Submitted Date");
      expect(stateAppDates[1].dateType).toBe("State Application Start Date");
    });

    it("should return empty array for non-matching prefix", () => {
      const completeDates = getDatesByPrefix(mockBundleDates, "Completeness");

      expect(completeDates).toHaveLength(0);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty bundle dates array", () => {
      const emptyDates: SimpleBundleDate[] = [];

      const date = getDateFromBundleDates(emptyDates, "Concept Start Date");
      expect(date).toBeNull();

      const updatedDates = setDateInBundleDates(emptyDates, "Concept Start Date", new Date());
      expect(updatedDates).toHaveLength(1);

      expect(hasDate(emptyDates, "Concept Start Date")).toBe(false);
    });

    it("should handle empty bundle phases array", () => {
      const emptyPhases: SimplePhase[] = [];

      const status = getStatusForPhase(emptyPhases, "Concept");
      expect(status).toBeNull();

      const updatedPhases = setStatusForPhase(emptyPhases, "Concept", "Started");
      expect(updatedPhases).toEqual([]);
    });

    it("should maintain object structure when updating", () => {
      const newDate = new Date("2025-04-01T05:00:00.000Z");
      const updatedDates = setDateInBundleDates(mockBundleDates, "Concept Start Date", newDate);

      // Check that the structure is maintained
      expect(updatedDates[0]).toHaveProperty("dateType");
      expect(updatedDates[0]).toHaveProperty("dateValue");
      expect(updatedDates[0].dateType).toBe("Concept Start Date");
    });

    it("should handle multiple dates with same prefix", () => {
      const dates: SimpleBundleDate[] = [
        { dateType: "Concept Start Date", dateValue: new Date("2025-01-01") },
        { dateType: "Concept Completion Date", dateValue: new Date("2025-01-31") },
        { dateType: "Pre-Submission Submitted Date", dateValue: new Date("2025-01-15") },
      ];

      const conceptDates = getDatesByPrefix(dates, "Concept");
      expect(conceptDates).toHaveLength(2);
    });

    it("should not modify original array with immutable operations", () => {
      const originalDates = [...mockBundleDates];

      setDateInBundleDates(mockBundleDates, "Concept Start Date", new Date());
      removeDateFromBundleDates(mockBundleDates, "Concept Start Date");

      expect(mockBundleDates).toEqual(originalDates);
    });
  });
});
