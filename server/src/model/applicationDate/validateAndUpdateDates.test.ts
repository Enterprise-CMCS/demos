import { describe, it, expect, vi } from "vitest";
import { LocalDate, SetApplicationDatesInput } from "../../types.js";
import { EasternTZDate } from "../../dateUtilities.js";
import { ParsedApplicationDateInput, ParsedSetApplicationDatesInput } from ".";
import { validateAndUpdateDates } from "./validateAndUpdateDates.js";
import { TZDate } from "@date-fns/tz";

// Mock imports
import {
  parseSetApplicationDatesInput,
  getApplicationDates,
  mergeApplicationDates,
  validateInputDates,
  upsertApplicationDates,
} from ".";

vi.mock(".", () => ({
  parseSetApplicationDatesInput: vi.fn(),
  getApplicationDates: vi.fn(),
  mergeApplicationDates: vi.fn(),
  validateInputDates: vi.fn(),
  upsertApplicationDates: vi.fn(),
}));

describe("validateAndUpdateDates", () => {
  const testPrismaTransaction: any = "Test";
  const testDateTimeValue1 = new Date("2025-01-01T00:00:00.000-05:00");
  const testDateTimeValue2: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate("2025-01-01T00:00:00.000-05:00", "America/New_York"),
  };
  const testLocalDateValue3 = "2025-10-31" as LocalDate;
  const testDateTimeValue3: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate("2025-10-31T00:00:00.000-04:00", "America/New_York"),
  };
  const testDateTimeValue4: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate("2025-11-13T00:00:00.000-05:00", "America/New_York"),
  };

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
        dateValue: testLocalDateValue3,
      },
    ],
  };
  const testParsedResult: ParsedSetApplicationDatesInput = {
    applicationId: testApplicationId,
    applicationDates: [
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testDateTimeValue2,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: testDateTimeValue3,
      },
    ],
  };
  const testExistingDates: ParsedApplicationDateInput[] = [
    {
      dateType: "BNPMT Initial Meeting Date",
      dateValue: testDateTimeValue4,
    },
  ];
  const testMergedDates: ParsedApplicationDateInput[] = [
    {
      dateType: "Federal Comment Period Start Date",
      dateValue: testDateTimeValue2,
    },
    {
      dateType: "Federal Comment Period End Date",
      dateValue: testDateTimeValue3,
    },
    {
      dateType: "BNPMT Initial Meeting Date",
      dateValue: testDateTimeValue4,
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
