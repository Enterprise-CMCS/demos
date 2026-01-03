import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAllowedNoteChangeByPhase } from "./validateAllowedNoteChangeByPhase";
import { PrismaTransactionClient } from "../../prismaClient";
import { NoteType, SetApplicationNotesInput } from "../../types";
import { queryApplicationNotesByNoteTypes } from "./queries/queryApplicationNotesByNoteTypes";
import { filterChangingNoteTypes } from "./filterChangingNoteTypes";
import { queryApplicationNoteTypesOnFinishedPhases } from "./queries/queryApplicationNoteTypesOnFinishedPhases";

vi.mock("./queries/queryApplicationNotesByNoteTypes", () => ({
  queryApplicationNotesByNoteTypes: vi.fn(),
}));

vi.mock("./filterChangingNoteTypes", () => ({
  filterChangingNoteTypes: vi.fn(),
}));

vi.mock("./queries/queryApplicationNoteTypesOnFinishedPhases", () => ({
  queryApplicationNoteTypesOnFinishedPhases: vi.fn(),
}));

describe("validateAllowedNoteChangeByPhase", () => {
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testNoteType1: NoteType = "PO and OGD";
  const testNoteType2: NoteType = "CMS (OSORA) Clearance";
  const testPhaseId1 = "Application Intake";
  const testPhaseId2 = "Review";

  let mockTransaction: PrismaTransactionClient;

  beforeEach(() => {
    mockTransaction = {} as PrismaTransactionClient;
    vi.resetAllMocks();
  });

  describe("when no notes are changing", () => {
    it("should not throw error when no notes are changing", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "test content" }],
      };

      vi.mocked(queryApplicationNotesByNoteTypes).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          content: "test content",
        },
      ]);
      vi.mocked(filterChangingNoteTypes).mockReturnValue([]);
      vi.mocked(queryApplicationNoteTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(queryApplicationNotesByNoteTypes).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        [testNoteType1]
      );
      expect(filterChangingNoteTypes).toHaveBeenCalledWith(input.applicationNotes, [
        {
          noteTypeId: testNoteType1,
          content: "test content",
        },
      ]);
      expect(queryApplicationNoteTypesOnFinishedPhases).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        []
      );
    });
  });

  describe("when notes are changing on non-completed phases", () => {
    it("should not throw error when changing notes are not on completed phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "test modified content" }],
      };

      vi.mocked(queryApplicationNotesByNoteTypes).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          content: "test content",
        },
      ]);
      vi.mocked(filterChangingNoteTypes).mockReturnValue([testNoteType1]);
      vi.mocked(queryApplicationNoteTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(queryApplicationNoteTypesOnFinishedPhases).toHaveBeenCalledWith(
        mockTransaction,
        testApplicationId,
        [testNoteType1]
      );
    });
  });

  describe("when notes are changing on completed phases", () => {
    it("should throw error when single note is on a completed phase", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "test modified content" }],
      };

      vi.mocked(queryApplicationNotesByNoteTypes).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          content: "test content",
        },
      ]);
      vi.mocked(filterChangingNoteTypes).mockReturnValue([testNoteType1]);
      vi.mocked(queryApplicationNoteTypesOnFinishedPhases).mockResolvedValue([
        {
          phaseId: testPhaseId1,
          noteTypeId: testNoteType1,
        } as any,
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with finished phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });

    it("should throw error with multiple notes when they are on finished phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          { noteType: testNoteType1, content: "test content 1" },
          { noteType: testNoteType2, content: "test content 2" },
        ],
      };

      vi.mocked(queryApplicationNotesByNoteTypes).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          content: "test modified content 1",
        },
        {
          noteTypeId: testNoteType2,
          content: "test modified content 2",
        },
      ]);
      vi.mocked(filterChangingNoteTypes).mockReturnValue([testNoteType1, testNoteType2]);
      vi.mocked(queryApplicationNoteTypesOnFinishedPhases).mockResolvedValue([
        {
          phaseId: testPhaseId1,
          noteTypeId: testNoteType1,
        } as any,
        {
          phaseId: testPhaseId2,
          noteTypeId: testNoteType2,
        } as any,
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with finished phases: ${testNoteType1} note on ${testPhaseId1} phase, ${testNoteType2} note on ${testPhaseId2} phase.`
      );
    });
  });

  describe("integration flow", () => {
    it("should handle null note values in input", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: null }],
      };

      vi.mocked(queryApplicationNotesByNoteTypes).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          content: "test content",
        },
      ]);
      vi.mocked(filterChangingNoteTypes).mockReturnValue([testNoteType1]);
      vi.mocked(queryApplicationNoteTypesOnFinishedPhases).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(filterChangingNoteTypes).toHaveBeenCalledWith(
        input.applicationNotes,
        expect.any(Array)
      );
    });
  });
});
