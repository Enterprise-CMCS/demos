import { TZDate } from "@date-fns/tz";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DateType, LocalDate, ApplicationDateInput } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { PrismaTransactionClient } from "../../prismaClient";
import { getOrderedPhaseDateTypes, OrderedPhaseDateTypes } from "../phaseDateType";
import { createPhaseStartDate } from "../applicationDate";
import { setPhaseToStarted, startPhasesByDates } from ".";
import { updateStatusToUnderReviewIfNeeded } from "./updateApplicationStatus";

vi.mock("../phaseDateType", () => ({
  getOrderedPhaseDateTypes: vi.fn(),
}));

vi.mock("./setPhaseToStarted", () => ({
  setPhaseToStarted: vi.fn(),
}));

vi.mock("./updateApplicationStatus", () => ({
  updateStatusToUnderReviewIfNeeded: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  createPhaseStartDate: vi.fn(),
}));

describe("startPhasesByDates", () => {
  const mockTransaction = {} as PrismaTransactionClient;
  const testApplicationId = "app-123-456";

  const mockEasternNow: EasternNow = {
    "Start of Day": {
      easternTZDate: new TZDate("2025-01-01T05:00:00.000Z"),
      isEasternTZDate: true,
    },
    "End of Day": {
      easternTZDate: new TZDate("2025-01-02T04:59:59.999Z"),
      isEasternTZDate: true,
    },
  };

  const mockOrderedPhaseDateTypes: OrderedPhaseDateTypes = [
    {
      phaseId: "Application Intake",
      dateTypeId: "Application Intake Start Date",
    },
    {
      phaseId: "Application Intake",
      dateTypeId: "State Application Submitted Date",
    },
    {
      phaseId: "Application Intake",
      dateTypeId: "Completeness Review Due Date",
    },
    {
      phaseId: "Completeness",
      dateTypeId: "Completeness Review Due Date",
    },
    {
      phaseId: "Completeness",
      dateTypeId: "State Application Deemed Complete",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrderedPhaseDateTypes).mockResolvedValue(mockOrderedPhaseDateTypes as any);
  });

  describe("basic functionality", () => {
    it("should return empty array when no dates are provided", async () => {
      const applicationDates: ApplicationDateInput[] = [];

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(result).toEqual([]);
      expect(getOrderedPhaseDateTypes).not.toHaveBeenCalled();
      expect(setPhaseToStarted).not.toHaveBeenCalled();
      expect(createPhaseStartDate).not.toHaveBeenCalled();
    });

    it("should fetch ordered phase date types once", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(getOrderedPhaseDateTypes).toHaveBeenCalledExactlyOnceWith(mockTransaction);
    });
  });

  describe("phase identification", () => {
    it("should throw error when date type is not found in phase date types", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Unknown Date Type" as DateType,
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];

      await expect(
        startPhasesByDates(mockTransaction, testApplicationId, applicationDates, mockEasternNow)
      ).rejects.toThrow("No phase found for date type Unknown Date Type");

      expect(setPhaseToStarted).not.toHaveBeenCalled();
    });

    it("should find correct phase for each date type", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: "2025-01-01" as LocalDate,
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: "2025-01-15" as LocalDate,
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(setPhaseToStarted).toHaveBeenCalledWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledWith(
        testApplicationId,
        "Completeness",
        mockTransaction
      );
    });
  });

  describe("phase starting", () => {
    it("should call startPhase for each date with correct arguments", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
    });

    it("should call startPhase for multiple dates", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(setPhaseToStarted).toHaveBeenCalledTimes(2);
      expect(setPhaseToStarted).toHaveBeenCalledWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledWith(
        testApplicationId,
        "Completeness",
        mockTransaction
      );
    });
  });

  describe("phase start date creation", () => {
    it("should not create start date when phase was not started", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(createPhaseStartDate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should create start date when phase was started", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      const mockStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate).mockReturnValue(mockStartDate);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith(
        "Application Intake",
        mockEasternNow
      );
      expect(result).toEqual([mockStartDate]);
    });

    it("should not add start date when createPhaseStartDate returns null", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate).mockReturnValue(null);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(result).toEqual([]);
    });
  });

  describe("duplicate start date filtering", () => {
    it("should not add start date when it matches the input date type", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];
      const mockStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T05:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate).mockReturnValue(mockStartDate);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(result).toEqual([]);
    });
  });

  describe("multiple dates processing", () => {
    it("should handle mix of started and not started phases", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "State Application Submitted Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-02-01T00:00:00.000Z"),
        },
      ];
      const mockStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted)
        .mockResolvedValueOnce(true) // Application Intake started
        .mockResolvedValueOnce(false); // Completeness not started
      vi.mocked(createPhaseStartDate).mockReturnValue(mockStartDate);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(result).toEqual([mockStartDate]);
      expect(createPhaseStartDate).toHaveBeenCalledOnce();
    });

    it("should handle mix of duplicate and unique start dates", async () => {
      const mockOrderedWithTwoPhases: OrderedPhaseDateTypes = [
        {
          phaseId: "Application Intake",
          dateTypeId: "Application Intake Start Date",
        },
        {
          phaseId: "Application Intake",
          dateTypeId: "Completeness Review Due Date",
        },
        {
          phaseId: "Completeness",
          dateTypeId: "Application Intake Start Date",
        },
        {
          phaseId: "Completeness",
          dateTypeId: "Completeness Review Due Date",
        },
      ];
      vi.mocked(getOrderedPhaseDateTypes).mockResolvedValue(mockOrderedWithTwoPhases as any);

      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-02-01T00:00:00.000Z"),
        },
      ];
      const mockIntakeStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T05:00:00.000Z"),
      };
      const mockCompletenessStartDate: ApplicationDateInput = {
        dateType: "Completeness Review Due Date",
        dateValue: new Date("2025-01-16T00:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate)
        .mockReturnValueOnce(mockIntakeStartDate) // Same type as input
        .mockReturnValueOnce(mockCompletenessStartDate); // Same type as input

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      // Both are duplicates, so neither should be returned
      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle date type that appears in multiple phases", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      // Should use the first match (find returns first match)
      expect(setPhaseToStarted).toHaveBeenCalledWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
    });
  });

  describe("return value", () => {
    it("should return ApplicationDateInput array", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Completeness Review Due Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      const mockStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate).mockReturnValue(mockStartDate);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(Array.isArray(result)).toBe(true);
      result.forEach((date) => {
        expect(date).toHaveProperty("dateType");
        expect(date).toHaveProperty("dateValue");
        expect(typeof date.dateType).toBe("string");
        expect(date.dateValue).toBeInstanceOf(Date);
      });
    });
  });

  describe("null date handling", () => {
    it("should skip null date values and not start phases for them", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: null,
        },
        {
          dateType: "State Application Submitted Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      // startPhase should only be called once for the non-null date
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(getOrderedPhaseDateTypes).toHaveBeenCalledExactlyOnceWith(mockTransaction);
      expect(result).toEqual([]);
    });

    it("should return empty array when all dates are null", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: null,
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: null,
        },
      ];

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      expect(setPhaseToStarted).not.toHaveBeenCalled();
      expect(createPhaseStartDate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should process mix of null and non-null dates correctly", async () => {
      const applicationDates: ApplicationDateInput[] = [
        {
          dateType: "Application Intake Start Date",
          dateValue: null,
        },
        {
          dateType: "State Application Submitted Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: null,
        },
      ];
      const mockStartDate: ApplicationDateInput = {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000Z"),
      };
      vi.mocked(setPhaseToStarted).mockResolvedValue(true);
      vi.mocked(createPhaseStartDate).mockReturnValue(mockStartDate);

      const result = await startPhasesByDates(
        mockTransaction,
        testApplicationId,
        applicationDates,
        mockEasternNow
      );

      // Only one call for the non-null date
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith(
        "Application Intake",
        mockEasternNow
      );
      expect(result).toEqual([mockStartDate]);
    });
  });
});
