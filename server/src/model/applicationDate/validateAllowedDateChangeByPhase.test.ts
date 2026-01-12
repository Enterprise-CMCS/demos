import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAllowedDateChangeByPhase } from "./validateAllowedDateChangeByPhase";
import { LocalDate, SetApplicationDatesInput } from "../../types";
import { PrismaTransactionClient } from "../../prismaClient";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getPhaseDateTypesByIds } from "../phaseDateType";

vi.mock("../applicationPhase", () => ({
  getFinishedApplicationPhaseIds: vi.fn(),
}));

vi.mock("../phaseDateType", () => ({
  getPhaseDateTypesByIds: vi.fn(),
}));

describe("validateAllowedDateChangeByPhase", () => {
  const mockTransaction = {} as any;
  const testApplicationId = "d04904ea-39dc-443a-ad60-54319f6be69b";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("when no completed phases have the date types", () => {
    it("should not throw an error for single date type", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseDateTypesByIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        ["Review"],
        ["State Concurrence"]
      );
    });

    it("should not throw an error for multiple date types", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
          {
            dateType: "Pre-Submission Submitted Date",
            dateValue: "2026-01-02" as LocalDate,
          },
          {
            dateType: "SME Review Date",
            dateValue: "2026-01-03" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseDateTypesByIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        ["Review", "Concept"],
        ["State Concurrence", "Pre-Submission Submitted Date", "SME Review Date"]
      );
    });

    it("should not throw an error when no dates are provided", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseDateTypesByIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        ["Review"],
        []
      );
    });

    it("should not throw an error when no phases are completed", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue([]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getPhaseDateTypesByIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        [],
        ["State Concurrence"]
      );
    });
  });

  describe("when completed phases have the date types", () => {
    it("should throw an error for single disallowed date", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([
        {
          phaseId: "Review",
          dateTypeId: "State Concurrence",
        },
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify dates because they are associated with finished phases: State Concurrence date on Review phase."
      );
    });

    it("should throw an error for multiple disallowed dates", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
          {
            dateType: "Pre-Submission Submitted Date",
            dateValue: "2026-01-02" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([
        {
          phaseId: "Review",
          dateTypeId: "State Concurrence",
        },
        {
          phaseId: "Concept",
          dateTypeId: "Pre-Submission Submitted Date",
        },
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify dates because they are associated with finished phases: State Concurrence date on Review phase, Pre-Submission Submitted Date date on Concept phase."
      );
    });

    it("should throw an error for same date type on multiple phases", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([
        {
          phaseId: "Review",
          dateTypeId: "State Concurrence",
        },
        {
          phaseId: "Concept",
          dateTypeId: "State Concurrence",
        },
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify dates because they are associated with finished phases: State Concurrence date on Review phase, State Concurrence date on Concept phase."
      );
    });

    it("should include all disallowed dates in error message", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
          {
            dateType: "Pre-Submission Submitted Date",
            dateValue: "2026-01-02" as LocalDate,
          },
          {
            dateType: "SME Review Date",
            dateValue: "2026-01-03" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue([
        "Review",
        "Concept",
        "SDG Preparation",
      ]);
      vi.mocked(getPhaseDateTypesByIds).mockResolvedValue([
        {
          phaseId: "Review",
          dateTypeId: "State Concurrence",
        },
        {
          phaseId: "Concept",
          dateTypeId: "Pre-Submission Submitted Date",
        },
        {
          phaseId: "SDG Preparation",
          dateTypeId: "SME Review Date",
        },
      ]);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify dates because they are associated with finished phases: State Concurrence date on Review phase, Pre-Submission Submitted Date date on Concept phase, SME Review Date date on SDG Preparation phase."
      );
    });
  });

  describe("edge cases", () => {
    it("should handle errors from getFinishedApplicationPhaseIds", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(getFinishedApplicationPhaseIds).mockRejectedValue(dbError);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle errors from getPhaseDateTypesByIds", async () => {
      const input: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "State Concurrence",
            dateValue: "2026-01-01" as LocalDate,
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      const dbError = new Error("Database query failed");
      vi.mocked(getPhaseDateTypesByIds).mockRejectedValue(dbError);

      await expect(validateAllowedDateChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Database query failed"
      );
    });
  });
});
