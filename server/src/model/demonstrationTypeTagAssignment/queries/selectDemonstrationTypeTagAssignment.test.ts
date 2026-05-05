import { DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectDemonstrationTypeTagAssignment } from "./selectDemonstrationTypeTagAssignment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDemonstrationTypeTagAssignment", () => {
  const regularMocks = {
    demonstrationTypeTagAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstrationTypeTagAssignment: {
      findAtMostOne: regularMocks.demonstrationTypeTagAssignment.findAtMostOne,
    },
  };
  const transactionMocks = {
    demonstrationTypeTagAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationTypeTagAssignment: {
      findAtMostOne: transactionMocks.demonstrationTypeTagAssignment.findAtMostOne,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
  const where = {
    demonstrationId: testDemonstrationId,
  };
  const expectedCall = {
    where: { demonstrationId: testDemonstrationId },
    include: { tag: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get demonstrationTypeTagAssignment and associated tags from the database directly if no transaction is given", async () => {
    await selectDemonstrationTypeTagAssignment(where);
    expect(
      regularMocks.demonstrationTypeTagAssignment.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstrationTypeTagAssignment.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get demonstrationTypeTagAssignment and associated tags via a transaction if one is given", async () => {
    await selectDemonstrationTypeTagAssignment(where, mockTransaction);
    expect(regularMocks.demonstrationTypeTagAssignment.findAtMostOne).not.toHaveBeenCalled();
    expect(
      transactionMocks.demonstrationTypeTagAssignment.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no demonstrationTypeTagAssignment is found", async () => {
    regularMocks.demonstrationTypeTagAssignment.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectDemonstrationTypeTagAssignment(where);
    expect(
      regularMocks.demonstrationTypeTagAssignment.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns demonstrationTypeTagAssignment and associated tags that is found", async () => {
    const demonstrationTypeTagAssignment = {
      demonstrationId: testDemonstrationId,
    } as PrismaDemonstrationTypeTagAssignment;
    regularMocks.demonstrationTypeTagAssignment.findAtMostOne.mockResolvedValueOnce(
      demonstrationTypeTagAssignment
    );

    const result = await selectDemonstrationTypeTagAssignment(where);
    expect(
      regularMocks.demonstrationTypeTagAssignment.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(demonstrationTypeTagAssignment);
  });
});
