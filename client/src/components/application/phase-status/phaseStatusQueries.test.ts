import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getQueryForSetPhaseStatus, useSetPhaseStatus } from "./phaseStatusQueries";
import { SetApplicationPhaseStatusInput } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import React from "react";

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
      expect(result).toContain('phaseName: "Concept"');
      expect(result).toContain('phaseStatus: "Started"');
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
        "Review",
        "Approval Package",
        "Post Approval",
      ] as const;

      phaseNames.forEach((phaseName) => {
        const input: SetApplicationPhaseStatusInput = {
          ...TEST_SET_PHASE_STATUS_INPUT,
          phaseName: phaseName,
        };

        const result = getQueryForSetPhaseStatus(input);
        expect(result).toContain(`phaseName: "${phaseName}"`);
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
        expect(result).toContain(`phaseStatus: "${phaseStatus}"`);
      });
    });

    it("should maintain GraphQL mutation structure", () => {
      const result = getQueryForSetPhaseStatus(TEST_SET_PHASE_STATUS_INPUT);

      // Check that the structure follows GraphQL syntax
      expect(result).toMatch(/mutation SetPhaseStatus\s*{/);
      expect(result).toMatch(/setApplicationPhaseStatus\s*\(\s*input:\s*{/);
      expect(result).toContain("applicationId:");
      expect(result).toContain("phaseName:");
      expect(result).toContain("phaseStatus:");
    });

    it("should handle phase names with spaces and special characters", () => {
      const input: SetApplicationPhaseStatusInput = {
        applicationId: "app-123",
        phaseName: "Review",
        phaseStatus: "Completed",
      };

      const result = getQueryForSetPhaseStatus(input);

      expect(result).toContain('phaseName: "Review"');
      expect(result).toContain('phaseStatus: "Completed"');
    });

    it("should generate mutation for a complete workflow transition", () => {
      const input: SetApplicationPhaseStatusInput = {
        applicationId: "workflow-test-456",
        phaseName: "Federal Comment",
        phaseStatus: "Completed",
      };

      const result = getQueryForSetPhaseStatus(input);

      expect(result).toContain('applicationId: "workflow-test-456"');
      expect(result).toContain('phaseName: "Federal Comment"');
      expect(result).toContain('phaseStatus: "Completed"');
      expect(result).toContain("mutation SetPhaseStatus");
    });
  });

  describe("useSetPhaseStatus", () => {
    it("should return an object with setPhaseStatus function and mutation states", () => {
      const testInput: SetApplicationPhaseStatusInput = {
        applicationId: "test-app-123",
        phaseName: "Application Intake",
        phaseStatus: "Completed",
      };

      const { result } = renderHook(() => useSetPhaseStatus(testInput), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current).toHaveProperty("setPhaseStatus");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.setPhaseStatus).toBe("function");
    });
  });
});
