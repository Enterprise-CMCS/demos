import { describe, it, expect } from "vitest";
import {
  getInputsForCompletenessPhase,
  getQueryForSetApplicationDates,
  useSetApplicationDate,
} from "./applicationDateQueries";
import { SetApplicationDatesInput } from "demos-server";
import { renderHook } from "@testing-library/react";
import React from "react";
import { TestProvider } from "test-utils/TestProvider";

const TEST_SET_PHASE_DATE_INPUT: SetApplicationDatesInput = {
  applicationId: "test-application-123",
  applicationDates: [
    {
      dateType: "Concept Start Date",
      dateValue: new Date(Date.parse("2025-01-15T10:30:00.000Z")),
    },
  ],
};

describe("applicationDateQueries", () => {
  describe("getQueryForSetApplicationDate", () => {
    it("should generate correct GraphQL mutation for Start Date", () => {
      const result = getQueryForSetApplicationDates(TEST_SET_PHASE_DATE_INPUT);

      expect(result).toContain("mutation SetApplicationDate");
      expect(result).toContain('applicationId: "test-application-123"');
      expect(result).toContain(
        'applicationDates: [{dateTypeId: "Concept Start Date", dateValue: "2025-01-15T10:30:00.000Z"}]'
      );
    });

    it("should handle special characters in applicationId", () => {
      const input: SetApplicationDatesInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        applicationId: "application-with-special-chars-123_abc",
      };

      const result = getQueryForSetApplicationDates(input);

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
        const input: SetApplicationDatesInput = {
          ...TEST_SET_PHASE_DATE_INPUT,
          applicationDates: [
            {
              ...TEST_SET_PHASE_DATE_INPUT.applicationDates[0],
              dateType: dateType,
            },
          ],
        };

        const result = getQueryForSetApplicationDates(input);
        expect(result).toContain(`dateTypeId: "${dateType}"`);
      });
    });

    it("should preserve exact date precision", () => {
      const preciseDate = new Date("2025-02-14T14:30:45.123Z");
      const input: SetApplicationDatesInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        applicationDates: [
          {
            ...TEST_SET_PHASE_DATE_INPUT.applicationDates[0],
            dateValue: preciseDate,
          },
        ],
      };

      const result = getQueryForSetApplicationDates(input);

      // Verify the exact ISO string is used
      expect(result).toContain('dateValue: "2025-02-14T14:30:45.123Z"');
    });

    it("should maintain GraphQL mutation structure", () => {
      const result = getQueryForSetApplicationDates(TEST_SET_PHASE_DATE_INPUT);

      // Check that the structure follows GraphQL syntax
      expect(result).toMatch(/mutation SetApplicationDate\s*{/);
      expect(result).toMatch(/setApplicationDate\s*\(\s*input:\s*{/);
      expect(result).toContain("applicationId:");
      expect(result).toMatch(/applicationDates:\s*\[/);
      expect(result).toContain("dateTypeId:");
      expect(result).toContain("dateValue:");
    });
  });

  describe("useSetApplicationDate", () => {
    it("should return an object with setApplicationDate function and mutation states", () => {
      const testInput: SetApplicationDatesInput = {
        applicationId: "test-app-123",
        applicationDates: [
          {
            dateType: "Application Intake Completion Date",
            dateValue: new Date("2024-10-13T10:00:00.000Z"),
          },
        ],
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

describe("getInputsForCompletenessPhase", () => {
  const baseDate = new Date("2025-01-01T00:00:00.000Z");
  const makeDate = (offsetDays: number) =>
    new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  it("includes all completeness dates when provided together", () => {
    const state = baseDate;
    const start = makeDate(1);
    const end = makeDate(30);
    const completion = makeDate(31);

    const inputs = getInputsForCompletenessPhase("app-456", {
      "State Application Deemed Complete": state,
      "Federal Comment Period Start Date": start,
      "Federal Comment Period End Date": end,
      "Completeness Completion Date": completion,
    });

    expect(inputs).toEqual({
      applicationId: "app-456",
      applicationDates: [
        {
          dateType: "State Application Deemed Complete",
          dateValue: state,
        },
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: start,
        },
        {
          dateType: "Federal Comment Period End Date",
          dateValue: end,
        },
        {
          dateType: "Completeness Completion Date",
          dateValue: completion,
        },
      ],
    });
  });
});
