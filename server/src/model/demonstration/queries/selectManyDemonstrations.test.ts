import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyDemonstrations } from "./selectManyDemonstrations";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDemonstrations", () => {
  const regularMocks = {
    demonstration: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstration: {
      findMany: regularMocks.demonstration.findMany,
    },
  };
  const transactionMocks = {
    demonstration: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstration: {
      findMany: transactionMocks.demonstration.findMany,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
  const testDemonstrationId2 = "demonstration-2";
  const where = {
    id: testDemonstrationId,
  };
  const expectedCall = {
    where: { id: testDemonstrationId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get demonstrations from the database directly if no transaction is given", async () => {
    await selectManyDemonstrations(where);
    expect(regularMocks.demonstration.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.findMany).not.toHaveBeenCalled();
  });

  it("should get demonstrations via a transaction if one is given", async () => {
    await selectManyDemonstrations(where, mockTransaction);
    expect(regularMocks.demonstration.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.demonstration.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no demonstrations are found", async () => {
    regularMocks.demonstration.findMany.mockResolvedValueOnce([]);
    const result = await selectManyDemonstrations(where);
    expect(regularMocks.demonstration.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all demonstrations that are found", async () => {
    const demonstrations = [{ id: testDemonstrationId }, { id: testDemonstrationId2 }] as PrismaDemonstration[];
    regularMocks.demonstration.findMany.mockResolvedValueOnce(demonstrations);

    const result = await selectManyDemonstrations(where);
    expect(regularMocks.demonstration.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(demonstrations);
  });
});
