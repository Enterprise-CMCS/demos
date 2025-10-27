import { describe, it, expect } from "vitest";
import { getQueryForSetPhaseStatus } from "./phaseStatusQueries";
import { SetApplicationPhaseStatusInput } from "demos-server";

const TEST_SET_PHASE_STATUS_INPUT: SetApplicationPhaseStatusInput = {
  applicationId: "test-application-123",
  phaseName: "Concept",
  phaseStatus: "Started",
};

describe("phaseStatusQueries", () => {
  describe("getQueryForSetPhaseStatus", () => {
    it("should generate correct GraphQL mutation", () => {
      const result = getQueryForSetPhaseStatus(TEST_SET_PHASE_STATUS_INPUT);

      expect(result).toContain("mutation SetPhaseStatus");
      expect(result).toContain('applicationId: "test-application-123"');
      expect(result).toContain("phaseName: Concept");
      expect(result).toContain("phaseStatus: Started");
    });

    it("should handle special characters in applicationId", () => {
      const input: SetApplicationPhaseStatusInput = {
        ...TEST_SET_PHASE_STATUS_INPUT,
        applicationId: "application-with-special-chars-123_abc",
      };

      const result = getQueryForSetPhaseStatus(input);

      expect(result).toContain('applicationId: "application-with-special-chars-123_abc"');
    });

    it("should generate correct mutation for different phase names", () => {
      const phaseNames = [
        "Concept",
        "Application Intake",
        "Completeness",
        "Federal Comment",
        "SDG Preparation",
        "OGC & OMB Review",
        "Approval Package",
        "Post Approval",
      ] as const;

      phaseNames.forEach((phaseName) => {
        const input: SetApplicationPhaseStatusInput = {
          ...TEST_SET_PHASE_STATUS_INPUT,
          phaseName: phaseName,
        };

        const result = getQueryForSetPhaseStatus(input);
        expect(result).toContain(`phaseName: ${phaseName}`);
      });
    });

    it("should generate correct mutation for different phase statuses", () => {
      const phaseStatuses = [
        "Not Started",
        "Started",
        "Completed",
        "Incomplete",
        "Skipped",
      ] as const;

      phaseStatuses.forEach((phaseStatus) => {
        const input: SetApplicationPhaseStatusInput = {
          ...TEST_SET_PHASE_STATUS_INPUT,
          phaseStatus: phaseStatus,
        };

        const result = getQueryForSetPhaseStatus(input);
        expect(result).toContain(`phaseStatus: ${phaseStatus}`);
      });
    });

    it("should maintain GraphQL mutation structure", () => {
      const result = getQueryForSetPhaseStatus(TEST_SET_PHASE_STATUS_INPUT);

      // Check that the structure follows GraphQL syntax
      expect(result).toMatch(/mutation SetPhaseStatus\s*{/);
      expect(result).toMatch(/setPhaseStatus\s*\(\s*input:\s*{/);
      expect(result).toContain("applicationId:");
      expect(result).toContain("phaseName:");
      expect(result).toContain("phaseStatus:");
      expect(result).toMatch(/}\s*\)\s*}/);
    });

    it("should handle phase names with spaces and special characters", () => {
      const input: SetApplicationPhaseStatusInput = {
        applicationId: "app-123",
        phaseName: "OGC & OMB Review",
        phaseStatus: "Completed",
      };

      const result = getQueryForSetPhaseStatus(input);

      expect(result).toContain("phaseName: OGC & OMB Review");
      expect(result).toContain("phaseStatus: Completed");
    });

    it("should generate mutation for a complete workflow transition", () => {
      const input: SetApplicationPhaseStatusInput = {
        applicationId: "workflow-test-456",
        phaseName: "Federal Comment",
        phaseStatus: "Completed",
      };

      const result = getQueryForSetPhaseStatus(input);

      expect(result).toContain('applicationId: "workflow-test-456"');
      expect(result).toContain("phaseName: Federal Comment");
      expect(result).toContain("phaseStatus: Completed");
      expect(result).toContain("mutation SetPhaseStatus");
    });
  });
});
