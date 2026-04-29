import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectDemonstration } from "./selectDemonstration";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDemonstration", () => {
  const regularMocks = {
    demonstration: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstration: {
      findAtMostOne: regularMocks.demonstration.findAtMostOne,
    },
  };
  const transactionMocks = {
    demonstration: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstration: {
      findAtMostOne: transactionMocks.demonstration.findAtMostOne,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
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

  it("should get demonstration from the database directly if no transaction is given", async () => {
    await selectDemonstration(where);
    expect(regularMocks.demonstration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get demonstration via a transaction if one is given", async () => {
    await selectDemonstration(where, mockTransaction);
    expect(regularMocks.demonstration.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.demonstration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no demonstration is found", async () => {
    regularMocks.demonstration.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectDemonstration(where);
    expect(regularMocks.demonstration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns demonstration that is found", async () => {
    const demonstration = { id: testDemonstrationId } as PrismaDemonstration;
    regularMocks.demonstration.findAtMostOne.mockResolvedValueOnce(demonstration);

    const result = await selectDemonstration(where);
    expect(regularMocks.demonstration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(demonstration);
  });
});
