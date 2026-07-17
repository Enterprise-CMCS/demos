// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { insertUser } from "./insertUser";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertUser", () => {
  // Test inputs
  const testInput: Prisma.UserUncheckedCreateInput = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
    personTypeId: "demos-admin",
    cognitoSubject: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    username: "ada.lovelace",
    isMigratedFromPmda: false,
    hasLoggedIn: true,
  };

  // Mock return values
  const regularMocks = {
    user: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      create: regularMocks.user.create,
    },
  };

  const transactionMocks = {
    user: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    user: {
      create: transactionMocks.user.create,
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
    await insertUser(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.user.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.user.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertUser(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.user.create).not.toHaveBeenCalled();
    expect(transactionMocks.user.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
