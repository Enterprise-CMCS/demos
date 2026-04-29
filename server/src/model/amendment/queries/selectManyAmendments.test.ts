import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyAmendments } from "./selectManyAmendments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyAmendments", () => {
  const regularMocks = {
    amendment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    amendment: {
      findMany: regularMocks.amendment.findMany,
    },
  };
  const transactionMocks = {
    amendment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    amendment: {
      findMany: transactionMocks.amendment.findMany,
    },
  } as any;

  const testAmendmentId = "amendment-1";
  const testAmendmentId2 = "amendment-2";
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

  it("should get amendments from the database directly if no transaction is given", async () => {
    await selectManyAmendments(where);
    expect(regularMocks.amendment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.amendment.findMany).not.toHaveBeenCalled();
  });

  it("should get amendments via a transaction if one is given", async () => {
    await selectManyAmendments(where, mockTransaction);
    expect(regularMocks.amendment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no amendments are found", async () => {
    regularMocks.amendment.findMany.mockResolvedValueOnce([]);
    const result = await selectManyAmendments(where);
    expect(regularMocks.amendment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all amendments that are found", async () => {
    const amendments = [{ id: testAmendmentId }, { id: testAmendmentId2 }] as PrismaAmendment[];
    regularMocks.amendment.findMany.mockResolvedValueOnce(amendments);

    const result = await selectManyAmendments(where);
    expect(regularMocks.amendment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(amendments);
  });
});
