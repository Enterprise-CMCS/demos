import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectDemonstrationRoleAssignment } from "./selectDemonstrationRoleAssignment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDemonstrationRoleAssignment", () => {
  const regularMocks = {
    demonstrationRoleAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstrationRoleAssignment: {
      findAtMostOne: regularMocks.demonstrationRoleAssignment.findAtMostOne,
    },
  };
  const transactionMocks = {
    demonstrationRoleAssignment: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationRoleAssignment: {
      findAtMostOne: transactionMocks.demonstrationRoleAssignment.findAtMostOne,
    },
  } as any;

  const testDemonstrationId = "demonstration-1";
  const where = {
    demonstrationId: testDemonstrationId,
  };
  const expectedCall = {
    where: { demonstrationId: testDemonstrationId },
    include: { primaryDemonstrationRoleAssignment: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get demonstrationRoleAssignment and isPrimary indicator from the database directly if no transaction is given", async () => {
    await selectDemonstrationRoleAssignment(where);
    expect(regularMocks.demonstrationRoleAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.demonstrationRoleAssignment.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get demonstrationRoleAssignment and isPrimary indicator via a transaction if one is given", async () => {
    await selectDemonstrationRoleAssignment(where, mockTransaction);
    expect(regularMocks.demonstrationRoleAssignment.findAtMostOne).not.toHaveBeenCalled();
    expect(
      transactionMocks.demonstrationRoleAssignment.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no demonstrationRoleAssignment is found", async () => {
    regularMocks.demonstrationRoleAssignment.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectDemonstrationRoleAssignment(where);
    expect(regularMocks.demonstrationRoleAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns demonstrationRoleAssignment and isPrimary indicator that is found", async () => {
    const demonstrationRoleAssignment = {
      demonstrationId: testDemonstrationId,
      primaryDemonstrationRoleAssignment: {
        demonstrationId: testDemonstrationId,
      },
    } as PrismaDemonstrationRoleAssignment & {
      primaryDemonstrationRoleAssignment: { demonstrationId: string };
    };
    regularMocks.demonstrationRoleAssignment.findAtMostOne.mockResolvedValueOnce(
      demonstrationRoleAssignment
    );

    const result = await selectDemonstrationRoleAssignment(where);
    expect(regularMocks.demonstrationRoleAssignment.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toStrictEqual({
      demonstrationId: testDemonstrationId,
      isPrimary: true,
    });
  });
});
