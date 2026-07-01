// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { updateUser } from "./updateUser";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("updateUser", () => {
  // Test inputs
  const testWhere: Prisma.UserWhereUniqueInput = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
  };
  const testData: Prisma.UserUncheckedUpdateInput = {
    cognitoSubject: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    username: "ada.lovelace",
    hasLoggedIn: true,
  };

  // Mock return values
  const regularMocks = {
    user: {
      update: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      update: regularMocks.user.update,
    },
  };

  const transactionMocks = {
    user: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    user: {
      update: transactionMocks.user.update,
    },
  } as any;

  // Expected call
  const expectedCall = {
    where: testWhere,
    data: testData,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should update using a new client if no transaction is given", async () => {
    await updateUser(testWhere, testData);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.user.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.user.update).not.toHaveBeenCalled();
  });

  it("should update using an existing client if provided", async () => {
    await updateUser(testWhere, testData, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.user.update).not.toHaveBeenCalled();
    expect(transactionMocks.user.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
