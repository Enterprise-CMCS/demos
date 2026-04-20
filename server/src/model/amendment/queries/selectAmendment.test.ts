import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectAmendment } from "./selectAmendment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectAmendment", () => {
  const regularMocks = {
    amendment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    amendment: {
      findAtMostOne: regularMocks.amendment.findAtMostOne,
    },
  };
  const transactionMocks = {
    amendment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    amendment: {
      findAtMostOne: transactionMocks.amendment.findAtMostOne,
    },
  } as any;

  const testAmendmentId = "amendment-1";
  const where = {
    id: testAmendmentId,
  };
  const expectedCall = {
    where: { id: testAmendmentId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get amendment from the database directly if no transaction is given", async () => {
    await selectAmendment(where);
    expect(regularMocks.amendment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.amendment.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get amendment via a transaction if one is given", async () => {
    await selectAmendment(where, mockTransaction);
    expect(regularMocks.amendment.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no amendment is found", async () => {
    regularMocks.amendment.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectAmendment(where);
    expect(regularMocks.amendment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns amendment that is found", async () => {
    const amendment = { id: testAmendmentId } as PrismaAmendment;
    regularMocks.amendment.findAtMostOne.mockResolvedValueOnce(amendment);

    const result = await selectAmendment(where);
    expect(regularMocks.amendment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(amendment);
  });
});
