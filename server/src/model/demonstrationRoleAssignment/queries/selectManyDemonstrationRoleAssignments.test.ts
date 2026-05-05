import {
  PrimaryDemonstrationRoleAssignment,
  Prisma,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyDemonstrationRoleAssignments } from "./selectManyDemonstrationRoleAssignments";
import { type DemonstrationRoleAssignmentQueryResult } from ".";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDemonstrationRoleAssignments", () => {
  const regularMocks = {
    demonstrationRoleAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstrationRoleAssignment: {
      findMany: regularMocks.demonstrationRoleAssignment.findMany,
    },
  };
  const transactionMocks = {
    demonstrationRoleAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationRoleAssignment: {
      findMany: transactionMocks.demonstrationRoleAssignment.findMany,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
  const testDemonstrationId2 = "demonstration-2";
  const where: Prisma.DemonstrationRoleAssignmentWhereInput = {
    demonstrationId: testDemonstrationId,
  };
  const expectedCall = {
    where: { demonstrationId: testDemonstrationId },
    include: { primaryDemonstrationRoleAssignment: true },
  };

  const mockDemonstrationRoleAssignmentPrismaResult = [
    {
      demonstrationId: testDemonstrationId,
      primaryDemonstrationRoleAssignment: { demonstrationId: "primary-1" },
    },
    {
      demonstrationId: testDemonstrationId2,
      primaryDemonstrationRoleAssignment: null,
    },
  ] as (PrismaDemonstrationRoleAssignment & {
    primaryDemonstrationRoleAssignment: PrimaryDemonstrationRoleAssignment;
  })[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get demonstrationRoleAssignments and isPrimary indicator from the database directly if no transaction is given", async () => {
    regularMocks.demonstrationRoleAssignment.findMany.mockResolvedValueOnce(
      mockDemonstrationRoleAssignmentPrismaResult
    );

    await selectManyDemonstrationRoleAssignments(where);
    expect(regularMocks.demonstrationRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.demonstrationRoleAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should get demonstrationRoleAssignments and isPrimary indicator via a transaction if one is given", async () => {
    transactionMocks.demonstrationRoleAssignment.findMany.mockResolvedValueOnce(
      mockDemonstrationRoleAssignmentPrismaResult
    );
    await selectManyDemonstrationRoleAssignments(where, mockTransaction);
    expect(regularMocks.demonstrationRoleAssignment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.demonstrationRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no demonstrationRoleAssignments are found", async () => {
    regularMocks.demonstrationRoleAssignment.findMany.mockResolvedValueOnce([]);
    const result = await selectManyDemonstrationRoleAssignments(where);
    expect(regularMocks.demonstrationRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all demonstrationRoleAssignments and isPrimary indicators that are found", async () => {
    regularMocks.demonstrationRoleAssignment.findMany.mockResolvedValueOnce(
      mockDemonstrationRoleAssignmentPrismaResult
    );

    const result = await selectManyDemonstrationRoleAssignments(where);
    expect(regularMocks.demonstrationRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toStrictEqual([
      {
        demonstrationId: testDemonstrationId,
        isPrimary: true,
      },
      {
        demonstrationId: testDemonstrationId2,
        isPrimary: false,
      },
    ] as DemonstrationRoleAssignmentQueryResult[]);
  });
});
