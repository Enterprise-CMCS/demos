import { ApplicationTagAssignment as PrismaApplicationTagAssignment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectApplicationTagAssignment } from "./selectApplicationTagAssignment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectApplicationTagAssignment", () => {
  const regularMocks = {
    applicationTagAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationTagAssignment: {
      findAtMostOne: regularMocks.applicationTagAssignment.findAtMostOne,
    },
  };
  const transactionMocks = {
    applicationTagAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagAssignment: {
      findAtMostOne: transactionMocks.applicationTagAssignment.findAtMostOne,
    },
  } as any;

  const testApplicationId = "application-1";
  const where = {
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

  it("should get applicationTagAssignment and associated tags from the database directly if no transaction is given", async () => {
    await selectApplicationTagAssignment(where);
    expect(regularMocks.applicationTagAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationTagAssignment.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get applicationTagAssignment and associated tags via a transaction if one is given", async () => {
    await selectApplicationTagAssignment(where, mockTransaction);
    expect(regularMocks.applicationTagAssignment.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.applicationTagAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no applicationTagAssignment is found", async () => {
    regularMocks.applicationTagAssignment.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectApplicationTagAssignment(where);
    expect(regularMocks.applicationTagAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns applicationTagAssignment and associated tags that is found", async () => {
    const applicationTagAssignment = {
      applicationId: testApplicationId,
    } as PrismaApplicationTagAssignment;
    regularMocks.applicationTagAssignment.findAtMostOne.mockResolvedValueOnce(
      applicationTagAssignment
    );

    const result = await selectApplicationTagAssignment(where);
    expect(regularMocks.applicationTagAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationTagAssignment);
  });
});
