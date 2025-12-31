import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAllowedDateChangeByPhase } from "./validateAllowedDateChangeByPhase";
import { PrismaTransactionClient } from "../../prismaClient";
import { DateTimeOrLocalDate, DateType, SetApplicationDatesInput } from "../../types";
import { queryApplicationDatesByDateTypes } from "./queries/queryApplicationDatesByDateTypes";
import { filterChangingDateTypes } from "./filterChangingDateTypes";
import { queryApplicationDateTypesOnFinishedPhases } from "./queries/queryApplicationDateTypesOnFinishedPhases";

vi.mock("./queries/queryApplicationDatesByDateTypes", () => ({
  queryApplicationDatesByDateTypes: vi.fn(),
}));

vi.mock("./filterChangingDateTypes", () => ({
  filterChangingDateTypes: vi.fn(),
}));

vi.mock("./queries/queryApplicationDateTypesOnFinishedPhases", () => ({
  queryApplicationDateTypesOnFinishedPhases: vi.fn(),
}));

describe("validateAllowedDateChangeByPhase", () => {
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testDateType1: DateType = "OGC Review Complete";
  const testDateType2: DateType = "PO & OGD Sign-Off";
  const testPhaseId1 = "Application Intake";
  const testPhaseId2 = "Review";

  let mockTransaction: PrismaTransactionClient;

  beforeEach(() => {
    mockTransaction = {} as PrismaTransactionClient;
    vi.resetAllMocks();
  });

  describe("when no dates are changing", () => {
    it("should not throw error when no dates are changing", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          { dateType: testDateType1, dateValue: "2025-12-22" as DateTimeOrLocalDate },
        ],
      };

      vi.mocked(queryApplicationDatesByDateTypes).mockResolvedValue([
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
      ]);
      vi.mocked(filterChangingDateTypes).mockReturnValue([]);
      vi.mocked(queryApplicationDateTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(queryApplicationDatesByDateTypes).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        [testDateType1]
      );
      expect(filterChangingDateTypes).toHaveBeenCalledWith(input.applicationDates, [
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
      ]);
      expect(queryApplicationDateTypesOnFinishedPhases).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        []
      );
    });
  });

  describe("when dates are changing on non-completed phases", () => {
    it("should not throw error when changing dates are not on completed phases", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          { dateType: testDateType1, dateValue: "2025-12-23" as DateTimeOrLocalDate },
        ],
      };

      vi.mocked(queryApplicationDatesByDateTypes).mockResolvedValue([
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
      ]);
      vi.mocked(filterChangingDateTypes).mockReturnValue([testDateType1]);
      vi.mocked(queryApplicationDateTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(queryApplicationDateTypesOnFinishedPhases).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        [testDateType1]
      );
    });
  });

  describe("when dates are changing on completed phases", () => {
    it("should throw error when single date is on a completed phase", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          { dateType: testDateType1, dateValue: "2025-12-23" as DateTimeOrLocalDate },
        ],
      };

      vi.mocked(queryApplicationDatesByDateTypes).mockResolvedValue([
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
      ]);
      vi.mocked(filterChangingDateTypes).mockReturnValue([testDateType1]);
      vi.mocked(queryApplicationDateTypesOnFinishedPhases).mockResolvedValue([
        {
          phaseId: testPhaseId1,
          dateTypeId: testDateType1,
        } as any,
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify dates because they are associated with completed phases: ${testDateType1} date on ${testPhaseId1} phase.`
      );
    });

    it("should throw error with multiple dates when they are on completed phases", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          { dateType: testDateType1, dateValue: "2025-12-23" as DateTimeOrLocalDate },
          { dateType: testDateType2, dateValue: "2025-12-24" as DateTimeOrLocalDate },
        ],
      };

      vi.mocked(queryApplicationDatesByDateTypes).mockResolvedValue([
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
        {
          dateTypeId: testDateType2,
          dateValue: new Date("2025-12-23T05:00:00.000Z"),
        },
      ]);
      vi.mocked(filterChangingDateTypes).mockReturnValue([testDateType1, testDateType2]);
      vi.mocked(queryApplicationDateTypesOnFinishedPhases).mockResolvedValue([
        {
          phaseId: testPhaseId1,
          dateTypeId: testDateType1,
        } as any,
        {
          phaseId: testPhaseId2,
          dateTypeId: testDateType2,
        } as any,
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify dates because they are associated with completed phases: ${testDateType1} date on ${testPhaseId1} phase, ${testDateType2} date on ${testPhaseId2} phase.`
      );
    });
  });

  describe("integration flow", () => {
    it("should handle null date values in input", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [{ dateType: testDateType1, dateValue: null }],
      };

      vi.mocked(queryApplicationDatesByDateTypes).mockResolvedValue([
        {
          dateTypeId: testDateType1,
          dateValue: new Date("2025-12-22T05:00:00.000Z"),
        },
      ]);
      vi.mocked(filterChangingDateTypes).mockReturnValue([testDateType1]);
      vi.mocked(queryApplicationDateTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(filterChangingDateTypes).toHaveBeenCalledWith(
        input.applicationDates,
        expect.any(Array)
      );
    });
  });
});
