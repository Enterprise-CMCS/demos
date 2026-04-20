import { Prisma, ApplicationTagAssignment as PrismaApplicationTagAssignment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyApplicationTagAssignments } from "./selectManyApplicationTagAssignments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationTagAssignments", () => {
  const regularMocks = {
    applicationTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationTagAssignment: {
      findMany: regularMocks.applicationTagAssignment.findMany,
    },
  };
  const transactionMocks = {
    applicationTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagAssignment: {
      findMany: transactionMocks.applicationTagAssignment.findMany,
    },
  } as any;

  const testApplicationId = "application-1";
  const testApplicationId2 = "application-2";
  const where: Prisma.ApplicationTagAssignmentWhereInput = {
    applicationId: testApplicationId,
  };
  const expectedCall = {
    where: { applicationId: testApplicationId },
    include: { tag: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get applicationTagAssignments and associated tags from the database directly if no transaction is given", async () => {
    await selectManyApplicationTagAssignments(where);
    expect(regularMocks.applicationTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationTagAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should get applicationTagAssignments and associated tags via a transaction if one is given", async () => {
    await selectManyApplicationTagAssignments(where, mockTransaction);
    expect(regularMocks.applicationTagAssignment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.applicationTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no applicationTagAssignments are found", async () => {
    regularMocks.applicationTagAssignment.findMany.mockResolvedValueOnce([]);
    const result = await selectManyApplicationTagAssignments(where);
    expect(regularMocks.applicationTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all applicationTagAssignments and associated tags that are found", async () => {
    const applicationTagAssignment = [
      { applicationId: testApplicationId },
      { applicationId: testApplicationId2 },
    ] as PrismaApplicationTagAssignment[];
    regularMocks.applicationTagAssignment.findMany.mockResolvedValueOnce(applicationTagAssignment);

    const result = await selectManyApplicationTagAssignments(where);
    expect(regularMocks.applicationTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationTagAssignment);
  });
});
