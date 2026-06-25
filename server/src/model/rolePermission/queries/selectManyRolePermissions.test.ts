// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { selectManyRolePermissions } from "./selectManyRolePermissions";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectManyRolePermissions", () => {
  // Test inputs
  const testWhere: Prisma.RolePermissionWhereInput = {
    roleId: "Admin User",
  };

  // Mock return values
  const regularMocks = {
    rolePermission: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    rolePermission: {
      findMany: regularMocks.rolePermission.findMany,
    },
  };

  const transactionMocks = {
    rolePermission: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    rolePermission: {
      findMany: transactionMocks.rolePermission.findMany,
    },
  } as any;

  // Expected call
  const expectedCall = {
    where: testWhere,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should query using a new client if no transaction is given", async () => {
    await selectManyRolePermissions(testWhere);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.rolePermission.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.rolePermission.findMany).not.toHaveBeenCalled();
  });

  it("should query using an existing client if provided", async () => {
    await selectManyRolePermissions(testWhere, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.rolePermission.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.rolePermission.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
