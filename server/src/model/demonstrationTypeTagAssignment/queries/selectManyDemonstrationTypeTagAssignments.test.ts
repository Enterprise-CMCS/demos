import {
  Prisma,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyDemonstrationTypeTagAssignments } from "./selectManyDemonstrationTypeTagAssignments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDemonstrationTypeTagAssignments", () => {
  const regularMocks = {
    demonstrationTypeTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstrationTypeTagAssignment: {
      findMany: regularMocks.demonstrationTypeTagAssignment.findMany,
    },
  };
  const transactionMocks = {
    demonstrationTypeTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationTypeTagAssignment: {
      findMany: transactionMocks.demonstrationTypeTagAssignment.findMany,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
  const testDemonstrationId2 = "demonstration-2";
  const where: Prisma.DemonstrationTypeTagAssignmentWhereInput = {
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

  it("should get demonstrationTypeTagAssignments and associated tags from the database directly if no transaction is given", async () => {
    await selectManyDemonstrationTypeTagAssignments(where);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should get demonstrationTypeTagAssignments and associated tags via a transaction if one is given", async () => {
    await selectManyDemonstrationTypeTagAssignments(where, mockTransaction);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
    expect(
      transactionMocks.demonstrationTypeTagAssignment.findMany
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no demonstrationTypeTagAssignments are found", async () => {
    regularMocks.demonstrationTypeTagAssignment.findMany.mockResolvedValueOnce([]);
    const result = await selectManyDemonstrationTypeTagAssignments(where);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all demonstrationTypeTagAssignments and associated tags that are found", async () => {
    const demonstrationTypeTagAssignment = [
      { demonstrationId: testDemonstrationId },
      { demonstrationId: testDemonstrationId2 },
    ] as PrismaDemonstrationTypeTagAssignment[];
    regularMocks.demonstrationTypeTagAssignment.findMany.mockResolvedValueOnce(
      demonstrationTypeTagAssignment
    );

    const result = await selectManyDemonstrationTypeTagAssignments(where);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(demonstrationTypeTagAssignment);
  });
});
