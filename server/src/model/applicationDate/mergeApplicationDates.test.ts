import { describe, it, expect } from "vitest";
import { mergeApplicationDates } from "./mergeApplicationDates.js";
import { ApplicationDateInput, ParsedApplicationDateInput } from "../../types.js";

describe("mergeApplicationDates", () => {
  it("should merge the two lists correctly", () => {
    const testOldDateValue: Date = new Date("2025-01-01T00:00:00Z");
    const testNewDateValue: Date = new Date("2025-01-07T00:00:00Z");
    const testExistingDates: ParsedApplicationDateInput[] = [
      {
        dateType: "Concept Start Date",
        dateValue: testOldDateValue,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testOldDateValue,
      },
    ];
    const testNewDates: ParsedApplicationDateInput[] = [
      {
        dateType: "BNPMT Initial Meeting Date",
        dateValue: testOldDateValue,
      },
      {
        dateType: "Concept Start Date",
        dateValue: testNewDateValue,
      },
    ];
    const expectedResult: ApplicationDateInput[] = [
      {
        dateType: "Concept Start Date",
        dateValue: testNewDateValue,
      },
      {
        dateType: "BNPMT Initial Meeting Date",
        dateValue: testOldDateValue,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testOldDateValue,
      },
    ];
    const result = mergeApplicationDates(testExistingDates, testNewDates);
    expect(result).toEqual(expect.arrayContaining(expectedResult));
    expect(result).toHaveLength(expectedResult.length);
  });
});
