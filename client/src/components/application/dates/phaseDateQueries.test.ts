import { describe, it, expect } from "vitest";
import { getQueryForSetPhaseDate } from "./phaseDateQueries";
import { SetPhaseDateInput } from "demos-server";

const TEST_SET_PHASE_DATE_INPUT: SetPhaseDateInput = {
  bundleId: "test-bundle-123",
  phase: "Concept",
  dateType: "Start Date",
  dateValue: new Date(Date.parse("2025-01-15T10:30:00.000Z")),
};

describe("phaseDateQueries", () => {
  describe("getQueryForSetPhaseDate", () => {
    it("should generate correct GraphQL mutation for Start Date", () => {
      const result = getQueryForSetPhaseDate(TEST_SET_PHASE_DATE_INPUT);

      expect(result).toContain("mutation SetPhaseDate");
      expect(result).toContain('bundleId: "test-bundle-123"');
      expect(result).toContain("phase: Concept");
      expect(result).toContain("dateType: Start Date");
      expect(result).toContain('dateValue: "2025-01-15T10:30:00.000Z"');
    });

    it("should handle special characters in bundleId", () => {
      const input: SetPhaseDateInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        bundleId: "bundle-with-special-chars-123_abc",
      };

      const result = getQueryForSetPhaseDate(input);

      expect(result).toContain('bundleId: "bundle-with-special-chars-123_abc"');
    });

    it("should generate correct mutation for different phases", () => {
      const phases = ["Concept", "State Application", "Completeness"] as const;

      phases.forEach((phase) => {
        const input: SetPhaseDateInput = {
          ...TEST_SET_PHASE_DATE_INPUT,
          phase: phase,
        };

        const result = getQueryForSetPhaseDate(input);
        expect(result).toContain(`phase: ${phase}`);
      });
    });

    it("should generate correct mutation for different date types", () => {
      const dateTypes = [
        "Start Date",
        "Completion Date",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ] as const;

      dateTypes.forEach((dateType) => {
        const input: SetPhaseDateInput = {
          ...TEST_SET_PHASE_DATE_INPUT,
          dateType: dateType,
        };

        const result = getQueryForSetPhaseDate(input);
        expect(result).toContain(`dateType: ${dateType}`);
      });
    });

    it("should preserve exact date precision", () => {
      const preciseDate = new Date("2025-02-14T14:30:45.123Z");
      const input: SetPhaseDateInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        dateValue: preciseDate,
      };

      const result = getQueryForSetPhaseDate(input);

      // Verify the exact ISO string is used
      expect(result).toContain('dateValue: "2025-02-14T14:30:45.123Z"');
    });

    it("should maintain GraphQL mutation structure", () => {
      const result = getQueryForSetPhaseDate(TEST_SET_PHASE_DATE_INPUT);

      // Check that the structure follows GraphQL syntax
      expect(result).toMatch(/mutation SetPhaseDate\s*{/);
      expect(result).toMatch(/setPhaseDate\s*\(\s*input:\s*{/);
      expect(result).toContain("bundleId:");
      expect(result).toContain("phase:");
      expect(result).toContain("dateType:");
      expect(result).toContain("dateValue:");
      expect(result).toMatch(/}\s*\)\s*}/);
    });
  });
});
