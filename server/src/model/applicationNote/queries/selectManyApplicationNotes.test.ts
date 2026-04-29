import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyApplicationNotes } from "./selectManyApplicationNotes";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationNotes", () => {
  const regularMocks = {
    applicationNote: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationNote: {
      findMany: regularMocks.applicationNote.findMany,
    },
  };
  const transactionMocks = {
    applicationNote: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationNote: {
      findMany: transactionMocks.applicationNote.findMany,
    },
  } as any;

  const testApplicationId = "application-1";
  const testApplicationId2 = "application-2";
  const where = {
    applicationId: testApplicationId,
  };
  const expectedCall = {
    where: { applicationId: testApplicationId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get applicationNotes from the database directly if no transaction is given", async () => {
    await selectManyApplicationNotes(where);
    expect(regularMocks.applicationNote.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.applicationNote.findMany).not.toHaveBeenCalled();
  });

  it("should get applicationNotes via a transaction if one is given", async () => {
    await selectManyApplicationNotes(where, mockTransaction);
    expect(regularMocks.applicationNote.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.applicationNote.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no applicationNotes are found", async () => {
    regularMocks.applicationNote.findMany.mockResolvedValueOnce([]);
    const result = await selectManyApplicationNotes(where);
    expect(regularMocks.applicationNote.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all applicationNotes that are found", async () => {
    const applicationNotes = [
      { applicationId: testApplicationId },
      { applicationId: testApplicationId2 },
    ] as PrismaApplicationNote[];
    regularMocks.applicationNote.findMany.mockResolvedValueOnce(applicationNotes);

    const result = await selectManyApplicationNotes(where);
    expect(regularMocks.applicationNote.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(applicationNotes);
  });
});
