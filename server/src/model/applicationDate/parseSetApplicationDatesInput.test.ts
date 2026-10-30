import { describe, it, expect, vi } from "vitest";
import { SetApplicationDatesInput } from "../../types.js";
import { parseSetApplicationDatesInput } from "./parseSetApplicationDatesInput.js";

// Mock imports
import { parseLocalDateToEasternTZDate } from "../../dateUtilities.js";

vi.mock("../../dateUtilities.js", () => ({
  parseLocalDateToEasternTZDate: vi.fn(),
}));

describe("parseInputApplicationDates", () => {
  const testApplicationId = "155e76dd-df48-47f6-a50f-b1300c29ca27";
  const testPlainDate1 = "2025-01-15";
  const testPlainDate2 = "2025-01-30";
  const testInputs: SetApplicationDatesInput = {
    applicationId: testApplicationId,
    applicationDates: [
      {
        dateType: "Federal Comment Period Start Date",
        plainDate: testPlainDate1,
      },
      {
        dateType: "Federal Comment Period End Date",
        plainDate: testPlainDate2,
      },
      {
        dateType: "Review Completion Date",
        plainDate: null,
      },
    ],
  };

  it("should call the parse function to return a parsed object", () => {
    const expectedCalls = [
      [testPlainDate1, "Start of Day"],
      [testPlainDate2, "End of Day"],
    ];

    parseSetApplicationDatesInput(testInputs);
    expect(vi.mocked(parseLocalDateToEasternTZDate).mock.calls).toEqual(expectedCalls);
  });

  it("should add null items to the deletion list", () => {
    const result = parseSetApplicationDatesInput(testInputs);
    expect(result.applicationDatesToDelete).toEqual(["Review Completion Date"]);
  });

  it("should returl non-null items in the upsert list", () => {
    const result = parseSetApplicationDatesInput(testInputs);
    expect(result.applicationDatesToUpsert).toEqual([
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: undefined,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: undefined,
      },
    ]);
  });
});
