// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { selectManyPrivateComments } from "./selectManyPrivateComments";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectManyPrivateComments", () => {
  // Test inputs
  const testInput = { id: "379fa3be-d8e5-42f0-b9ba-436d5c498eb6" };

  // Mock return values
  const regularMocks = {
    privateComment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    privateComment: {
      findMany: regularMocks.privateComment.findMany,
    },
  };

  const transactionMocks = {
    privateComment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    privateComment: {
      findMany: transactionMocks.privateComment.findMany,
    },
  } as any;

  // Expected call
  const expectedCall = {
    where: {
      id: testInput.id,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should select the private comments using a new client if no transaction is given", async () => {
    await selectManyPrivateComments(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.privateComment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.privateComment.findMany).not.toHaveBeenCalled();
  });

  it("should select the private comments using an existing client if provided", async () => {
    await selectManyPrivateComments(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.privateComment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.privateComment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
