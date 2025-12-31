import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resolveApplicationNoteType, __setApplicationNotes } from "./applicationNoteResolvers";
import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication } from "../application/applicationResolvers";
import { parseSetApplicationNotesInput, upsertApplicationNotes, deleteApplicationNotes } from ".";
import { SetApplicationNotesInput } from "../../types";
import { checkForNoteChangesOnCompletedPhase } from "./checkForNoteChangesOnCompletedPhase";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application/applicationResolvers", () => ({
  getApplication: vi.fn(),
}));

vi.mock("./parseSetApplicationNotesInput", () => ({
  parseSetApplicationNotesInput: vi.fn((input) => input),
}));

vi.mock("./queries/upsertApplicationNotes", () => ({
  upsertApplicationNotes: vi.fn(),
}));

vi.mock("./queries/deleteApplicationNotes", () => ({
  deleteApplicationNotes: vi.fn(),
}));

vi.mock("./checkForNoteChangesOnCompletedPhase", () => ({
  checkForNoteChangesOnCompletedPhase: vi.fn(),
}));

describe("applicationNoteResolvers", () => {
  const mockTransaction: any = "Test";
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testNoteContent = "Test Note Content";
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__setApplicationNotes", () => {
    const testInput: SetApplicationNotesInput = {
      applicationId: testApplicationId,
      applicationNotes: [
        {
          noteType: "PO and OGD",
          content: testNoteContent,
        },
        {
          noteType: "OGC and OMB",
          content: testNoteContent,
        },
      ],
    };

    it("should do nothing if an empty list of notes is passed", async () => {
      const testInput: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [],
      };
      await __setApplicationNotes(undefined, { input: testInput });
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      expect(prisma).not.toHaveBeenCalled();
    });

    it("should validate and update based on the input if it is present", async () => {
      await __setApplicationNotes(undefined, { input: testInput });
      expect(parseSetApplicationNotesInput).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(upsertApplicationNotes).toHaveBeenCalledExactlyOnceWith(testInput, mockTransaction);
      expect(deleteApplicationNotes).toHaveBeenCalledExactlyOnceWith(testInput, mockTransaction);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockPrismaClient.$transaction.mockRejectedValueOnce(testError);
      await expect(__setApplicationNotes(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });

    it("should throw an error if you pass in the same noteType more than once", async () => {
      const testInput: SetApplicationNotesInput = {
        applicationId: testApplicationId,
        applicationNotes: [
          {
            noteType: "PO and OGD",
            content: testNoteContent,
          },
          {
            noteType: "OGC and OMB",
            content: testNoteContent,
          },
          {
            noteType: "COMMs Clearance",
            content: testNoteContent,
          },
          {
            noteType: "PO and OGD",
            content: testNoteContent,
          },
          {
            noteType: "OGC and OMB",
            content: testNoteContent,
          },
        ],
      };

      await expect(__setApplicationNotes(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(
        new Error(
          "The input contained the same noteType more than once for " +
            "these noteTypes: PO and OGD, OGC and OMB."
        )
      );
      expect(getApplication).not.toHaveBeenCalled();
    });

    it("should call checkForNoteChangesOnCompletedPhase with the correct parameters", async () => {
      await __setApplicationNotes(undefined, { input: testInput });
      expect(checkForNoteChangesOnCompletedPhase).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testInput
      );
    });
  });

  describe("__resolveApplicationNoteType", () => {
    it("should retrieve the requested note type", () => {
      const testPrismaResult: PrismaApplicationNote = {
        applicationId: testApplicationId,
        noteTypeId: "PO and OGD",
        content: testNoteContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = __resolveApplicationNoteType(testPrismaResult);
      expect(result).toBe("PO and OGD");
    });
  });
});
