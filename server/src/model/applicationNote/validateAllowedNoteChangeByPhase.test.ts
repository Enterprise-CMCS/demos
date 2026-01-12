import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAllowedNoteChangeByPhase } from "./validateAllowedNoteChangeByPhase";
import { SetApplicationNotesInput } from "../../types";
import { PrismaTransactionClient } from "../../prismaClient";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getPhaseNoteTypes } from "../phaseNoteType";

vi.mock("../applicationPhase", () => ({
  getFinishedApplicationPhaseIds: vi.fn(),
}));

vi.mock("../phaseNoteType", () => ({
  getPhaseNoteTypes: vi.fn(),
}));

describe("validateAllowedNoteChangeByPhase", () => {
  const mockTransaction = {} as any;
  const testApplicationId = "d04904ea-39dc-443a-ad60-54319f6be69b";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("when no completed phases have the note types", () => {
    it("should not throw an error for single note type", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseNoteTypes).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        ["Review"],
        ["PO and OGD"]
      );
    });

    it("should not throw an error for multiple note types", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content 1",
          },
          {
            noteType: "OGC and OMB",
            content: "Test note content 2",
          },
          {
            noteType: "CMS (OSORA) Clearance",
            content: "Test note content 3",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseNoteTypes).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        ["Review", "Concept"],
        ["PO and OGD", "OGC and OMB", "CMS (OSORA) Clearance"]
      );
    });

    it("should not throw an error when no notes are provided", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId
      );
      expect(getPhaseNoteTypes).toHaveBeenCalledExactlyOnceWith(mockTransaction, ["Review"], []);
    });

    it("should not throw an error when no phases are completed", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue([]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).resolves.not.toThrow();

      expect(getPhaseNoteTypes).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        [],
        ["PO and OGD"]
      );
    });
  });

  describe("when completed phases have the note types", () => {
    it("should throw an error for single disallowed note", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([
        {
          phaseId: "Review",
          noteTypeId: "PO and OGD",
        },
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify notes because they are associated with finished phases: PO and OGD note on Review phase."
      );
    });

    it("should throw an error for multiple disallowed notes", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content 1",
          },
          {
            noteType: "OGC and OMB",
            content: "Test note content 2",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([
        {
          phaseId: "Review",
          noteTypeId: "PO and OGD",
        },
        {
          phaseId: "Concept",
          noteTypeId: "OGC and OMB",
        },
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify notes because they are associated with finished phases: PO and OGD note on Review phase, OGC and OMB note on Concept phase."
      );
    });

    it("should throw an error for same note type on multiple phases", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note content",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review", "Concept"]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([
        {
          phaseId: "Review",
          noteTypeId: "PO and OGD",
        },
        {
          phaseId: "Concept",
          noteTypeId: "PO and OGD",
        },
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify notes because they are associated with finished phases: PO and OGD note on Review phase, PO and OGD note on Concept phase."
      );
    });

    it("should include all disallowed notes in error message", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note 1",
          },
          {
            noteType: "OGC and OMB",
            content: "Test note 2",
          },
          {
            noteType: "CMS (OSORA) Clearance",
            content: "Test note 3",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue([
        "Review",
        "Concept",
        "SDG Preparation",
      ]);
      vi.mocked(getPhaseNoteTypes).mockResolvedValue([
        {
          phaseId: "Review",
          noteTypeId: "PO and OGD",
        },
        {
          phaseId: "Concept",
          noteTypeId: "OGC and OMB",
        },
        {
          phaseId: "SDG Preparation",
          noteTypeId: "CMS (OSORA) Clearance",
        },
      ]);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Cannot modify notes because they are associated with finished phases: PO and OGD note on Review phase, OGC and OMB note on Concept phase, CMS (OSORA) Clearance note on SDG Preparation phase."
      );
    });
  });

  describe("edge cases", () => {
    it("should handle errors from getFinishedApplicationPhaseIds", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note",
          },
        ],
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(getFinishedApplicationPhaseIds).mockRejectedValue(dbError);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle errors from getPhaseNoteTypes", async () => {
      const input: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: "Test note",
          },
        ],
      };

      vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Review"]);
      const dbError = new Error("Database query failed");
      vi.mocked(getPhaseNoteTypes).mockRejectedValue(dbError);

      await expect(validateAllowedNoteChangeByPhase(mockTransaction, input)).rejects.toThrow(
        "Database query failed"
      );
    });
  });
});
