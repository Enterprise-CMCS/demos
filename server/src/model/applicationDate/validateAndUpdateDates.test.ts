import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalDate, SetApplicationDatesInput } from "../../types.js";
import { EasternTZDate } from "../../dateUtilities.js";
import { ParsedApplicationDateInput, ParsedSetApplicationDatesInput } from ".";
import { validateAndUpdateDates } from "./validateAndUpdateDates.js";
import { TZDate } from "@date-fns/tz";
import { SemVer } from "semver";

// Mock imports
vi.mock(".", () => ({
  deleteApplicationDates: vi.fn(),
  getApplicationDates: vi.fn(),
  mergeApplicationDates: vi.fn(),
  parseSetApplicationDatesInput: vi.fn(),
  upsertApplicationDates: vi.fn(),
  validateInputDates: vi.fn(),
  validateAllowedDateChangeByPhase: vi.fn(),
  validateAllowedDateChangeForApplication: vi.fn(),
  validateAllowedToChangeFederalCommentPeriodDates: vi.fn(),
  callFederalCommentPhaseUpdateProcedure: vi.fn(),
  parsedInputHasFederalCommentDate: vi.fn(),
}));

import {
  deleteApplicationDates,
  getApplicationDates,
  mergeApplicationDates,
  parseSetApplicationDatesInput,
  upsertApplicationDates,
  validateInputDates,
  validateAllowedDateChangeByPhase,
  validateAllowedDateChangeForApplication,
  validateAllowedToChangeFederalCommentPeriodDates,
  callFederalCommentPhaseUpdateProcedure,
  parsedInputHasFederalCommentDate,
} from ".";

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
    applicationDatesToUpsert: [
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: testDateTimeValue2,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: testDateTimeValue3,
      },
    ],
    applicationDatesToDelete: ["SME Initial Review Date"],
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

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("before 1.3.0", () => {
    const currentVersion = new SemVer("1.2.0");
    it("should parse, validate, and upsert the input dates, but not validate changes to the federal comment period dates, or update the federal comment phase status", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion);

      expect(validateAllowedDateChangeForApplication).toHaveBeenCalledExactlyOnceWith(
        testPrismaTransaction,
        testInput
      );
      expect(validateAllowedDateChangeByPhase).toHaveBeenCalledExactlyOnceWith(
        testPrismaTransaction,
        testInput
      );
      expect(parseSetApplicationDatesInput).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(getApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        testPrismaTransaction
      );
      expect(validateAllowedToChangeFederalCommentPeriodDates).not.toHaveBeenCalled();
      expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testExistingDates,
        testParsedResult.applicationDatesToUpsert,
        testParsedResult.applicationDatesToDelete
      );
      expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testMergedDates, currentVersion);
      expect(upsertApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testParsedResult,
        testPrismaTransaction
      );
      expect(deleteApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testParsedResult,
        testPrismaTransaction
      );
      expect(parsedInputHasFederalCommentDate).not.toHaveBeenCalled();
      expect(callFederalCommentPhaseUpdateProcedure).not.toHaveBeenCalled();
    });
  });

  describe("from 1.3.0", () => {
    const currentVersion = new SemVer("1.3.0");
    it("should parse, validate, and upsert the input dates, while validating changes to the federal comment period dates", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion);

      expect(validateAllowedDateChangeForApplication).toHaveBeenCalledExactlyOnceWith(
        testPrismaTransaction,
        testInput
      );
      expect(validateAllowedDateChangeByPhase).toHaveBeenCalledExactlyOnceWith(
        testPrismaTransaction,
        testInput
      );
      expect(parseSetApplicationDatesInput).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(getApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        testPrismaTransaction
      );
      expect(validateAllowedToChangeFederalCommentPeriodDates).toHaveBeenCalledExactlyOnceWith(
        testExistingDates,
        testParsedResult
      );
      expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testExistingDates,
        testParsedResult.applicationDatesToUpsert,
        testParsedResult.applicationDatesToDelete
      );
      expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testMergedDates, currentVersion);
      expect(upsertApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testParsedResult,
        testPrismaTransaction
      );
      expect(deleteApplicationDates).toHaveBeenCalledExactlyOnceWith(
        testParsedResult,
        testPrismaTransaction
      );
    });

    it("should not update the federal comment phase status if the right dates are not present", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);
      vi.mocked(parsedInputHasFederalCommentDate).mockReturnValue(false);

      const expectedCalls = [
        [testParsedResult, "Federal Comment Period Start Date"],
        [testParsedResult, "Federal Comment Period End Date"],
      ];

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion);

      expect(vi.mocked(parsedInputHasFederalCommentDate).mock.calls).toEqual(expectedCalls);
      expect(callFederalCommentPhaseUpdateProcedure).not.toHaveBeenCalled();
    });

    it("should update the federal comment phase status if the right dates are present", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);
      vi.mocked(parsedInputHasFederalCommentDate).mockReturnValue(true);

      // Note that because of short-circuit, only the first call will run
      const expectedCalls = [[testParsedResult, "Federal Comment Period Start Date"]];

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion);

      expect(vi.mocked(parsedInputHasFederalCommentDate).mock.calls).toEqual(expectedCalls);
      expect(callFederalCommentPhaseUpdateProcedure).toHaveBeenCalledExactlyOnceWith(
        testParsedResult.applicationId,
        testPrismaTransaction
      );
    });

    it("should update the federal comment phase status even if only one date is present", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);
      vi.mocked(parsedInputHasFederalCommentDate).mockReturnValueOnce(false);
      vi.mocked(parsedInputHasFederalCommentDate).mockReturnValueOnce(true);

      const expectedCalls = [
        [testParsedResult, "Federal Comment Period Start Date"],
        [testParsedResult, "Federal Comment Period End Date"],
      ];

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion);

      expect(vi.mocked(parsedInputHasFederalCommentDate).mock.calls).toEqual(expectedCalls);
      expect(callFederalCommentPhaseUpdateProcedure).toHaveBeenCalledExactlyOnceWith(
        testParsedResult.applicationId,
        testPrismaTransaction
      );
    });

    it("should bypass federal comment period change validation if given the right option", async () => {
      vi.mocked(parseSetApplicationDatesInput).mockReturnValueOnce(testParsedResult);
      vi.mocked(getApplicationDates).mockResolvedValueOnce(testExistingDates);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testMergedDates);

      await validateAndUpdateDates(testInput, testPrismaTransaction, currentVersion, {
        allowChangingExistingFederalCommentDates: true,
      });

      expect(validateAllowedToChangeFederalCommentPeriodDates).not.toHaveBeenCalled();
    });
  });
});
