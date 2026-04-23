import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectApplicationNote } from "./selectApplicationNote";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectApplicationNote", () => {
  const regularMocks = {
    applicationNote: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationNote: {
      findAtMostOne: regularMocks.applicationNote.findAtMostOne,
    },
  };
  const transactionMocks = {
    applicationNote: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationNote: {
      findAtMostOne: transactionMocks.applicationNote.findAtMostOne,
    },
  } as any;

  const testApplicationId = "application-1";
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

  it("should get applicationNote from the database directly if no transaction is given", async () => {
    await selectApplicationNote(where);
    expect(regularMocks.applicationNote.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationNote.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get applicationNote via a transaction if one is given", async () => {
    await selectApplicationNote(where, mockTransaction);
    expect(regularMocks.applicationNote.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.applicationNote.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no applicationNote is found", async () => {
    regularMocks.applicationNote.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectApplicationNote(where);
    expect(regularMocks.applicationNote.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns applicationNote that is found", async () => {
    const applicationNote = { applicationId: testApplicationId } as PrismaApplicationNote;
    regularMocks.applicationNote.findAtMostOne.mockResolvedValueOnce(applicationNote);

    const result = await selectApplicationNote(where);
    expect(regularMocks.applicationNote.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationNote);
  });
});
