import { describe, it, expect } from "vitest";
import { getStatusForPhase, setStatusForPhase, type SimplePhase } from "./phaseStatus";

const mockApplicationPhases: SimplePhase[] = [
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

describe("phaseStatus", () => {
  describe("Phase status operations", () => {
    it("should get status for existing phase", () => {
      const status = getStatusForPhase(mockApplicationPhases, "Concept");
      expect(status).toBe("Started");
    });

    it("should get status for different phase", () => {
      const status = getStatusForPhase(mockApplicationPhases, "State Application");
      expect(status).toBe("Not Started");
    });

    it("should return null for non-existent phase", () => {
      const status = getStatusForPhase(mockApplicationPhases, "None");
      expect(status).toBeNull();
    });

    it("should set status for existing phase", () => {
      const updatedPhases = setStatusForPhase(mockApplicationPhases, "Concept", "Completed");

      expect(updatedPhases).toHaveLength(3);
      expect(updatedPhases[0].phaseStatus).toBe("Completed");
      expect(updatedPhases[1].phaseStatus).toBe("Not Started"); // unchanged
      expect(updatedPhases[2].phaseStatus).toBe("Not Started"); // unchanged
    });

    it("should not modify original array when setting status", () => {
      const originalPhases = [...mockApplicationPhases];
      setStatusForPhase(mockApplicationPhases, "Concept", "Completed");

      expect(mockApplicationPhases).toEqual(originalPhases);
    });

    it("should return unchanged array when setting status for non-existent phase", () => {
      const updatedPhases = setStatusForPhase(mockApplicationPhases, "None", "Completed");

      expect(updatedPhases).toEqual(mockApplicationPhases);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty application phases array", () => {
      const emptyPhases: SimplePhase[] = [];

      const status = getStatusForPhase(emptyPhases, "Concept");
      expect(status).toBeNull();

      const updatedPhases = setStatusForPhase(emptyPhases, "Concept", "Started");
      expect(updatedPhases).toEqual([]);
    });
  });
});
