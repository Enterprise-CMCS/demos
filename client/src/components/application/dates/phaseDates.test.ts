import { describe, it, expect } from "vitest";
import {
  getStartOfDayEST,
  getEndOfDayEST,
  getStatusForPhase,
  setStatusForPhase,
  getDateFromPhaseDates,
  setDateInPhaseDates,
  getAllDatesForPhase,
  setAllDatesForPhase,
  type SimplePhase,
  type SimplePhaseDate,
} from "./phaseDates";

// Mock data for testing
const mockPhaseDates: SimplePhaseDate[] = [
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
];

const mockBundlePhases: SimplePhase[] = [
  {
    phaseName: "Concept",
    phaseStatus: "Started",
    phaseDates: [
      {
        dateType: "Concept Start Date",
        dateValue: new Date("2025-01-01T05:00:00.000Z"),
      },
    ],
  },
  {
    phaseName: "State Application",
    phaseStatus: "Not Started",
    phaseDates: [
      {
        dateType: "State Application Submitted Date",
        dateValue: new Date("2025-02-01T12:00:00.000Z"),
      },
    ],
  },
  {
    phaseName: "Completeness",
    phaseStatus: "Not Started",
    phaseDates: [],
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

  describe("Phase date operations", () => {
    it("should get existing date from phase dates", () => {
      const date = getDateFromPhaseDates(mockPhaseDates, "Concept Start Date");

      expect(date).toEqual(new Date("2025-01-01T05:00:00.000Z"));
    });

    it("should return null for non-existent date type", () => {
      const date = getDateFromPhaseDates(mockPhaseDates, "Federal Comment Period Start Date");

      expect(date).toBeNull();
    });

    it("should set date in phase dates for existing date type", () => {
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      const updatedDates = setDateInPhaseDates(mockPhaseDates, "Concept Start Date", newDate);

      expect(updatedDates).toHaveLength(3);
      expect(updatedDates[0].dateValue).toEqual(newDate);
      expect(updatedDates[1].dateValue).toEqual(mockPhaseDates[1].dateValue); // unchanged
    });

    it("should not modify original array when setting date", () => {
      const originalDates = [...mockPhaseDates];
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      setDateInPhaseDates(mockPhaseDates, "Concept Start Date", newDate);

      expect(mockPhaseDates).toEqual(originalDates);
    });

    it("should return unchanged array when setting non-existent date type", () => {
      const newDate = new Date("2025-02-01T05:00:00.000Z");
      const updatedDates = setDateInPhaseDates(
        mockPhaseDates,
        "Federal Comment Period End Date",
        newDate
      );

      expect(updatedDates).toEqual(mockPhaseDates);
    });

    it("should get all dates for existing phase", () => {
      const dates = getAllDatesForPhase(mockBundlePhases, "Concept");

      expect(dates).toHaveLength(1);
      expect(dates![0].dateType).toBe("Concept Start Date");
    });

    it("should return null for non-existent phase", () => {
      const dates = getAllDatesForPhase(mockBundlePhases, "None");

      expect(dates).toBeNull();
    });

    it("should return empty array for phase with no dates", () => {
      const dates = getAllDatesForPhase(mockBundlePhases, "Completeness");

      expect(dates).toEqual([]);
    });

    it("should set all dates for phase (same as setDateInPhaseDates)", () => {
      const newDate = new Date("2025-03-01T05:00:00.000Z");
      const updatedDates = setAllDatesForPhase(mockPhaseDates, "Concept Completion Date", newDate);

      expect(updatedDates).toHaveLength(3);
      expect(updatedDates[1].dateValue).toEqual(newDate);
      expect(updatedDates[0].dateValue).toEqual(mockPhaseDates[0].dateValue); // unchanged
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty phase dates array", () => {
      const emptyDates: SimplePhaseDate[] = [];

      const date = getDateFromPhaseDates(emptyDates, "Concept Start Date");
      expect(date).toBeNull();

      const updatedDates = setDateInPhaseDates(emptyDates, "Concept Start Date", new Date());
      expect(updatedDates).toEqual([]);
    });

    it("should handle empty bundle phases array", () => {
      const emptyPhases: SimplePhase[] = [];

      const status = getStatusForPhase(emptyPhases, "Concept");
      expect(status).toBeNull();

      const updatedPhases = setStatusForPhase(emptyPhases, "Concept", "Started");
      expect(updatedPhases).toEqual([]);

      const dates = getAllDatesForPhase(emptyPhases, "Concept");
      expect(dates).toBeNull();
    });

    it("should maintain object structure when updating", () => {
      const newDate = new Date("2025-04-01T05:00:00.000Z");
      const updatedDates = setDateInPhaseDates(mockPhaseDates, "Concept Start Date", newDate);

      // Check that the structure is maintained
      expect(updatedDates[0]).toHaveProperty("dateType");
      expect(updatedDates[0]).toHaveProperty("dateValue");
      expect(updatedDates[0].dateType).toBe("Concept Start Date");
    });

    it("should handle multiple phases with same date types", () => {
      const phases: SimplePhase[] = [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [{ dateType: "Concept Start Date", dateValue: new Date("2025-01-01") }],
        },
        {
          phaseName: "State Application",
          phaseStatus: "Not Started",
          phaseDates: [
            { dateType: "State Application Start Date", dateValue: new Date("2025-02-01") },
          ],
        },
      ];

      const conceptDates = getAllDatesForPhase(phases, "Concept");
      const stateDates = getAllDatesForPhase(phases, "State Application");

      expect(conceptDates![0].dateValue).toEqual(new Date("2025-01-01"));
      expect(stateDates![0].dateValue).toEqual(new Date("2025-02-01"));
    });
  });
});
