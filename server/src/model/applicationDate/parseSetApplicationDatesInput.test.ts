import { describe, it, expect, vi } from "vitest";
import { LocalDate, SetApplicationDatesInput } from "../../types.js";
import { parseSetApplicationDatesInput } from "./parseSetApplicationDatesInput.js";

// Mock imports
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";

vi.mock("../../dateUtilities.js", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
}));

describe("parseInputApplicationDates", () => {
  it("should call the parse function to return a parsed object", () => {
    const testApplicationId = "155e76dd-df48-47f6-a50f-b1300c29ca27";
    const testLocalDateValue1 = "2025-01-15" as LocalDate;
    const testLocalDateValue2 = "2025-01-30" as LocalDate;
    const testDateTimeValue1 = new Date("2025-02-13T12:11:13.123Z");

    const testInputs: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testLocalDateValue1,
        },
        {
          dateType: "Federal Comment Period End Date",
          dateValue: testLocalDateValue2,
        },
        {
          dateType: "Completeness Completion Date",
          dateValue: testDateTimeValue1,
        },
      ],
    };
    const expectedCalls = [
      [testLocalDateValue1, "Start of Day"],
      [testLocalDateValue2, "End of Day"],
      [testDateTimeValue1, "Start of Day"],
    ];

    parseSetApplicationDatesInput(testInputs);
    expect(vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mock.calls).toEqual(expectedCalls);
  });
});
