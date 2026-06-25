// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { insertSystemRoleAssignment } from "./insertSystemRoleAssignment";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertSystemRoleAssignment", () => {
  // Test inputs
  const testInput: Prisma.SystemRoleAssignmentUncheckedCreateInput = {
    personId: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
    grantLevelId: "System",
    personTypeId: "demos-admin",
    roleId: "Admin User",
  };

  // Mock return values
  const regularMocks = {
    systemRoleAssignment: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    systemRoleAssignment: {
      create: regularMocks.systemRoleAssignment.create,
    },
  };

  const transactionMocks = {
    systemRoleAssignment: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    systemRoleAssignment: {
      create: transactionMocks.systemRoleAssignment.create,
    },
  } as any;

  // Expected call
  const expectedCall = {
    data: testInput,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert using a new client if no transaction is given", async () => {
    await insertSystemRoleAssignment(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.systemRoleAssignment.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.systemRoleAssignment.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertSystemRoleAssignment(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.systemRoleAssignment.create).not.toHaveBeenCalled();
    expect(transactionMocks.systemRoleAssignment.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
