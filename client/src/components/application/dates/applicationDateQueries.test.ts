import { describe, it, expect } from "vitest";
import { getQueryForSetApplicationDate, useSetApplicationDate } from "./applicationDateQueries";
import { SetApplicationDateInput } from "demos-server";
import { renderHook } from "@testing-library/react";
import React from "react";
import { TestProvider } from "test-utils/TestProvider";

const TEST_SET_PHASE_DATE_INPUT: SetApplicationDateInput = {
  applicationId: "test-application-123",
  dateType: "Concept Start Date",
  dateValue: new Date(Date.parse("2025-01-15T10:30:00.000Z")),
};

describe("applicationDateQueries", () => {
  describe("getQueryForSetApplicationDate", () => {
    it("should generate correct GraphQL mutation for Start Date", () => {
      const result = getQueryForSetApplicationDate(TEST_SET_PHASE_DATE_INPUT);

      expect(result).toContain("mutation SetApplicationDate");
      expect(result).toContain('applicationId: "test-application-123"');
      expect(result).toContain('dateType: "Concept Start Date"');
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
        expect(result).toContain(`dateType: "${dateType}"`);
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

  describe("useSetApplicationDate", () => {
    it("should return an object with setApplicationDate function and mutation states", () => {
      const testInput: SetApplicationDateInput = {
        applicationId: "test-app-123",
        dateType: "Application Intake Completion Date",
        dateValue: new Date("2024-10-13T10:00:00.000Z"),
      };

      const { result } = renderHook(() => useSetApplicationDate(testInput), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current).toHaveProperty("setApplicationDate");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.setApplicationDate).toBe("function");
    });
  });
});
