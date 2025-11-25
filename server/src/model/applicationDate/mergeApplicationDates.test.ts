import { describe, it, expect } from "vitest";
import { ParsedApplicationDateInput } from ".";
import { EasternTZDate } from "../../dateUtilities.js";
import { TZDate } from "@date-fns/tz";
import { mergeApplicationDates } from "./mergeApplicationDates.js";

describe("mergeApplicationDates", () => {
  it("should merge the two lists correctly", () => {
    const testOldDateValue: EasternTZDate = {
      isEasternTZDate: true,
      easternTZDate: new TZDate("2025-01-01T00:00:00Z", "America/New_York"),
    };
    const testNewDateValue: EasternTZDate = {
      isEasternTZDate: true,
      easternTZDate: new TZDate("2025-01-07T00:00:00Z", "America/New_York"),
    };
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
    const expectedResult: ParsedApplicationDateInput[] = [
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
