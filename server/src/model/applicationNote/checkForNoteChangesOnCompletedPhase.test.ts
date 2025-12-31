import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkForNoteChangesOnCompletedPhase } from "./checkForNoteChangesOnCompletedPhase";
import { SetApplicationNotesInput } from "./applicationNoteSchema";
import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseStatus } from "../../types";

describe("checkForNoteChangesOnCompletedPhase", () => {
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testNoteType1 = "PO and OGD";
  const testNoteType2 = "OGC and OMB";
  const testPhaseId1 = "phase-1";
  const testPhaseId2 = "phase-2";

  let mockTransaction: PrismaTransactionClient;

  beforeEach(() => {
    mockTransaction = {
      applicationNote: {
        findMany: vi.fn(),
      },
      phaseNoteType: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaTransactionClient;
  });

  describe("when no notes are being changed", () => {
    it("should not throw an error if all notes have the same content", async () => {
      const existingContent = "Existing content";
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: existingContent }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: existingContent,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await expect(
        checkForNoteChangesOnCompletedPhase(mockTransaction, input)
      ).resolves.not.toThrow();

      // Should check for notes in completed phases with empty array (no changes)
      expect(mockTransaction.phaseNoteType.findMany).toHaveBeenCalledWith({
        where: {
          noteTypeId: { in: [] },
          phase: {
            applicationPhaseTypeLimit: {
              some: {
                applicationPhases: {
                  some: {
                    applicationId: testApplicationId,
                    phaseStatusId: "Completed" satisfies PhaseStatus,
                  },
                },
              },
            },
          },
        },
        select: {
          noteTypeId: true,
          phaseId: true,
        },
      });
    });

    it("should not throw an error if input is empty", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([]);
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await expect(
        checkForNoteChangesOnCompletedPhase(mockTransaction, input)
      ).resolves.not.toThrow();
    });
  });

  describe("when notes are being added (new notes)", () => {
    it("should not throw an error if new note is not associated with a completed phase", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "New note content" }],
      };

      // No existing notes
      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([]);

      // No completed phases associated with this note type
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await expect(
        checkForNoteChangesOnCompletedPhase(mockTransaction, input)
      ).resolves.not.toThrow();
    });

    it("should throw an error if new note is associated with a completed phase", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "New note content" }],
      };

      // No existing notes
      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([]);

      // This note type is associated with a completed phase
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });
  });

  describe("when notes are being modified (content changes)", () => {
    it("should not throw an error if modified note is not associated with a completed phase", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "Updated content" }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // No completed phases associated with this note type
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await expect(
        checkForNoteChangesOnCompletedPhase(mockTransaction, input)
      ).resolves.not.toThrow();
    });

    it("should throw an error if modified note is associated with a completed phase", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "Updated content" }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });

    it("should handle null content as a change from existing content", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: null }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Existing content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });
  });

  describe("when multiple notes are involved", () => {
    it("should not throw an error if only some notes are changed but none are on completed phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          { noteType: testNoteType1, content: "Updated content" },
          { noteType: testNoteType2, content: "Same content" },
        ],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType2,
          content: "Same content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // No completed phases
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await expect(
        checkForNoteChangesOnCompletedPhase(mockTransaction, input)
      ).resolves.not.toThrow();

      // Should only check for the changed note type
      expect(mockTransaction.phaseNoteType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            noteTypeId: { in: [testNoteType1] },
          }),
        })
      );
    });

    it("should throw an error with all affected notes when multiple notes are on completed phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          { noteType: testNoteType1, content: "Updated content 1" },
          { noteType: testNoteType2, content: "Updated content 2" },
        ],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType2,
          content: "Old content 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
        {
          noteTypeId: testNoteType2,
          phaseId: testPhaseId2,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase, ${testNoteType2} note on ${testPhaseId2} phase.`
      );
    });

    it("should throw an error for only the notes that are on completed phases", async () => {
      const testNoteType3 = "CMS (OSORA) Clearance";
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          { noteType: testNoteType1, content: "Updated content 1" },
          { noteType: testNoteType2, content: "Updated content 2" },
          { noteType: testNoteType3, content: "Updated content 3" },
        ],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType2,
          content: "Old content 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType3,
          content: "Old content 3",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Only testNoteType1 is on a completed phase
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });
  });

  describe("database query validation", () => {
    it("should query existing notes with correct parameters", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          { noteType: testNoteType1, content: "Content 1" },
          { noteType: testNoteType2, content: "Content 2" },
        ],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([]);
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await checkForNoteChangesOnCompletedPhase(mockTransaction, input);

      expect(mockTransaction.applicationNote.findMany).toHaveBeenCalledWith({
        where: {
          applicationId: testApplicationId,
          noteTypeId: { in: [testNoteType1, testNoteType2] },
        },
        select: {
          noteTypeId: true,
          content: true,
        },
      });
    });

    it("should query phase note types with correct structure including nested relations", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "New content" }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([]);
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([]);

      await checkForNoteChangesOnCompletedPhase(mockTransaction, input);

      expect(mockTransaction.phaseNoteType.findMany).toHaveBeenCalledWith({
        where: {
          noteTypeId: { in: [testNoteType1] },
          phase: {
            applicationPhaseTypeLimit: {
              some: {
                applicationPhases: {
                  some: {
                    applicationId: testApplicationId,
                    phaseStatusId: "Completed" satisfies PhaseStatus,
                  },
                },
              },
            },
          },
        },
        select: {
          noteTypeId: true,
          phaseId: true,
        },
      });
    });
  });

  describe("edge cases", () => {
    it("should handle the same note type appearing on multiple completed phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "Updated content" }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Old content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Same note type on multiple phases
      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId2,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase, ${testNoteType1} note on ${testPhaseId2} phase.`
      );
    });

    it("should handle empty string as different from existing content", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [{ noteType: testNoteType1, content: "" }],
      };

      vi.mocked(mockTransaction.applicationNote.findMany).mockResolvedValue([
        {
          applicationId: testApplicationId,
          noteTypeId: testNoteType1,
          content: "Existing content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(mockTransaction.phaseNoteType.findMany).mockResolvedValue([
        {
          noteTypeId: testNoteType1,
          phaseId: testPhaseId1,
        },
      ]);

      await expect(checkForNoteChangesOnCompletedPhase(mockTransaction, input)).rejects.toThrow(
        `Cannot modify notes because they are associated with completed phases: ${testNoteType1} note on ${testPhaseId1} phase.`
      );
    });
  });
});
