import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManySystemRoleAssignments } from "./selectManySystemRoleAssignments";
import { SystemRoleAssignmentQueryResult } from "..";
import { DeepPartial } from "../../../testUtilities";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManySystemRoleAssignments", () => {
  const regularMocks = {
    systemRoleAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    systemRoleAssignment: {
      findMany: regularMocks.systemRoleAssignment.findMany,
    },
  };
  const transactionMocks = {
    systemRoleAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    systemRoleAssignment: {
      findMany: transactionMocks.systemRoleAssignment.findMany,
    },
  } as any;

  const testPersonId = "person-1";

  const where = {
    personId: testPersonId,
  };
  const expectedCall = {
    where: { personId: testPersonId },
    include: {
      role: {
        include: {
          rolePermissions: true,
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get systemRoleAssignments from the database directly if no transaction is given", async () => {
    await selectManySystemRoleAssignments(where);
    expect(regularMocks.systemRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.systemRoleAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should get systemRoleAssignments via a transaction if one is given", async () => {
    await selectManySystemRoleAssignments(where, mockTransaction);
    expect(regularMocks.systemRoleAssignment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.systemRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no systemRoleAssignments are found", async () => {
    regularMocks.systemRoleAssignment.findMany.mockResolvedValueOnce([]);
    const result = await selectManySystemRoleAssignments(where);
    expect(regularMocks.systemRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all systemRoleAssignments that are found", async () => {
    const testSystemRoleAssignments: DeepPartial<SystemRoleAssignmentQueryResult>[] = [
      {
        personId: "person-1",
        role: {
          rolePermissions: [
            {
              permissionId: "role-1",
            },
            {
              permissionId: "role-2",
            },
          ],
        },
      },
      {
        personId: "person-2",
        role: {
          rolePermissions: [
            {
              permissionId: "role-2",
            },
            {
              permissionId: "role-3",
            },
          ],
        },
      },
    ];

    regularMocks.systemRoleAssignment.findMany.mockResolvedValueOnce(testSystemRoleAssignments);

    const result = await selectManySystemRoleAssignments(where);
    expect(regularMocks.systemRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(testSystemRoleAssignments);
  });
});
