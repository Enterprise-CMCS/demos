import { ApplicationPhase as PrismaApplicationPhase } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectApplicationPhase } from "./selectApplicationPhase";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectApplicationPhase", () => {
  const regularMocks = {
    applicationPhase: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationPhase: {
      findAtMostOne: regularMocks.applicationPhase.findAtMostOne,
    },
  };
  const transactionMocks = {
    applicationPhase: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationPhase: {
      findAtMostOne: transactionMocks.applicationPhase.findAtMostOne,
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

  it("should get applicationPhase from the database directly if no transaction is given", async () => {
    await selectApplicationPhase(where);
    expect(regularMocks.applicationPhase.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationPhase.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get applicationPhase via a transaction if one is given", async () => {
    await selectApplicationPhase(where, mockTransaction);
    expect(regularMocks.applicationPhase.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.applicationPhase.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no applicationPhase is found", async () => {
    regularMocks.applicationPhase.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectApplicationPhase(where);
    expect(regularMocks.applicationPhase.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns applicationPhase that is found", async () => {
    const applicationPhase = { applicationId: testApplicationId } as PrismaApplicationPhase;
    regularMocks.applicationPhase.findAtMostOne.mockResolvedValueOnce(applicationPhase);

    const result = await selectApplicationPhase(where);
    expect(regularMocks.applicationPhase.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationPhase);
  });
});
