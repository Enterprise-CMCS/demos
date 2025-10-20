import { describe, it, expect } from "vitest";
import { getQueryForSetApplicationDate } from "./applicationDateQueries";
import { SetApplicationDateInput } from "demos-server";

const TEST_SET_PHASE_DATE_INPUT: SetApplicationDateInput = {
  applicationId: "test-application-123",
  dateType: "Concept Start Date",
  dateValue: new Date(Date.parse("2025-01-15T10:30:00.000Z")),
};

describe("phaseDateQueries", () => {
  describe("getQueryForSetApplicationDate", () => {
    it("should generate correct GraphQL mutation for Start Date", () => {
      const result = getQueryForSetApplicationDate(TEST_SET_PHASE_DATE_INPUT);

      expect(result).toContain("mutation SetApplicationDate");
      expect(result).toContain('applicationId: "test-application-123"');
      expect(result).toContain("dateType: Concept Start Date");
      expect(result).toContain('dateValue: "2025-01-15T10:30:00.000Z"');
    });

    it("should handle special characters in applicationId", () => {
      const input: SetApplicationDateInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        applicationId: "application-with-special-chars-123_abc",
      };

      const result = getQueryForSetApplicationDate(input);

      expect(result).toContain('applicationId: "application-with-special-chars-123_abc"');
    });

    it("should generate correct mutation for different date types", () => {
      const dateTypes = [
        "Completeness Start Date",
        "Completeness Completion Date",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ] as const;

      dateTypes.forEach((dateType) => {
        const input: SetApplicationDateInput = {
          ...TEST_SET_PHASE_DATE_INPUT,
          dateType: dateType,
        };

        const result = getQueryForSetApplicationDate(input);
        expect(result).toContain(`dateType: ${dateType}`);
      });
    });

    it("should preserve exact date precision", () => {
      const preciseDate = new Date("2025-02-14T14:30:45.123Z");
      const input: SetApplicationDateInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        dateValue: preciseDate,
      };

      const result = getQueryForSetApplicationDate(input);

      // Verify the exact ISO string is used
      expect(result).toContain('dateValue: "2025-02-14T14:30:45.123Z"');
    });

    it("should maintain GraphQL mutation structure", () => {
      const result = getQueryForSetApplicationDate(TEST_SET_PHASE_DATE_INPUT);

      // Check that the structure follows GraphQL syntax
      expect(result).toMatch(/mutation SetApplicationDate\s*{/);
      expect(result).toMatch(/setApplicationDate\s*\(\s*input:\s*{/);
      expect(result).toContain("applicationId:");
      expect(result).toContain("dateType:");
      expect(result).toContain("dateValue:");
      expect(result).toMatch(/}\s*\)\s*}/);
    });
  });
});
