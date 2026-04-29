import { ApplicationPhase as PrismaApplicationPhase } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyApplicationPhases } from "./selectManyApplicationPhases";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationPhases", () => {
  const regularMocks = {
    applicationPhase: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationPhase: {
      findMany: regularMocks.applicationPhase.findMany,
    },
  };
  const transactionMocks = {
    applicationPhase: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationPhase: {
      findMany: transactionMocks.applicationPhase.findMany,
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

  it("should get applicationPhases from the database directly if no transaction is given", async () => {
    await selectManyApplicationPhases(where);
    expect(regularMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.applicationPhase.findMany).not.toHaveBeenCalled();
  });

  it("should get applicationPhases via a transaction if one is given", async () => {
    await selectManyApplicationPhases(where, mockTransaction);
    expect(regularMocks.applicationPhase.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no applicationPhases are found", async () => {
    regularMocks.applicationPhase.findMany.mockResolvedValueOnce([]);
    const result = await selectManyApplicationPhases(where);
    expect(regularMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all applicationPhases that are found", async () => {
    const applicationPhases = [
      { applicationId: testApplicationId },
      { applicationId: testApplicationId2 },
    ] as PrismaApplicationPhase[];
    regularMocks.applicationPhase.findMany.mockResolvedValueOnce(applicationPhases);

    const result = await selectManyApplicationPhases(where);
    expect(regularMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(applicationPhases);
  });
});
