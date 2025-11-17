import { describe, it, expect, vi } from "vitest";
import {
  ParsedApplicationDateInput,
  ParsedSetApplicationDatesInput,
  SetApplicationDatesInput,
} from "../../types.js";
import { validateAndUpdateDates } from "./validateAndUpdateDates.js";

// Mock imports
import {
  parseSetApplicationDatesInput,
  getApplicationDates,
  mergeApplicationDates,
  validateInputDates,
  upsertApplicationDates,
} from "./index.js";

vi.mock("./index.js", () => ({
  parseSetApplicationDatesInput: vi.fn(),
  getApplicationDates: vi.fn(),
  mergeApplicationDates: vi.fn(),
  validateInputDates: vi.fn(),
  upsertApplicationDates: vi.fn(),
}));

describe("validateAndUpdateDates", () => {
  const testPrismaTransaction: any = "Test";
  const testDateTimeValue1 = new Date("2025-01-01T00:00:00.000Z");
  const testLocalDateValue2 = "2025-10-31";
  const testDateTimeValue2 = new Date("2025-10-31T00:00:00.000Z");
  const testDateTimeValue3 = new Date("2025-11-13T00:00:00.000Z");

  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testInput: SetApplicationDatesInput = {
    applicationId: testApplicationId,
    applicationDates: [
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testDateTimeValue1,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: testLocalDateValue2,
      },
    ],
  };
  const testParsedResult: ParsedSetApplicationDatesInput = {
    applicationId: testApplicationId,
    applicationDates: [
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testDateTimeValue1,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: testDateTimeValue2,
      },
    ],
  };
  const testExistingDates: ParsedApplicationDateInput[] = [
    {
      dateType: "BNPMT Initial Meeting Date",
      dateValue: testDateTimeValue3,
    },
  ];
  const testMergedDates: ParsedApplicationDateInput[] = [
    {
      dateType: "Federal Comment Period Start Date",
      dateValue: testDateTimeValue1,
    },
    {
      dateType: "Federal Comment Period End Date",
      dateValue: testDateTimeValue2,
    },
    {
      dateType: "BNPMT Initial Meeting Date",
      dateValue: testDateTimeValue3,
    },
  ];

  it("should parse, validate, and upsert the input dates", async () => {
    vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce({
      applicationId: testApplicationId,
      applicationDates: testParsedResult.applicationDates,
    });
    vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
    vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);

    await validateAndUpdateDates(testInput, testPrismaTransaction);

    expect(parseSetApplicationDatesInput).toHaveBeenCalledExactlyOnceWith(testInput);
    expect(getApplicationDates).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPrismaTransaction
    );
    expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith(
      testExistingDates,
      testParsedResult.applicationDates
    );
    expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testMergedDates);
    expect(upsertApplicationDates).toHaveBeenCalledExactlyOnceWith(
      testParsedResult,
      testPrismaTransaction
    );
  });
});
