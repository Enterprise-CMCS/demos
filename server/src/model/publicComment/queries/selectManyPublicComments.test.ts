// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { selectManyPublicComments } from "./selectManyPublicComments";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectManyPublicComments", () => {
  // Test inputs
  const testInput = { id: "379fa3be-d8e5-42f0-b9ba-436d5c498eb6" };

  // Mock return values
  const regularMocks = {
    publicComment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    publicComment: {
      findMany: regularMocks.publicComment.findMany,
    },
  };

  const transactionMocks = {
    publicComment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    publicComment: {
      findMany: transactionMocks.publicComment.findMany,
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

  it("should select the public comments using a new client if no transaction is given", async () => {
    await selectManyPublicComments(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.publicComment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.publicComment.findMany).not.toHaveBeenCalled();
  });

  it("should select the public comments using an existing client if provided", async () => {
    await selectManyPublicComments(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.publicComment.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.publicComment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
