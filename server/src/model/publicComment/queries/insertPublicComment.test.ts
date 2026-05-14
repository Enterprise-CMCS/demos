// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { InsertPublicCommentInput } from "./insertPublicComment";

// Functions under test
import { insertPublicComment } from "./insertPublicComment";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertPublicComment", () => {
  // Test inputs
  const testInput: InsertPublicCommentInput = {
    deliverableId: "570e1370-c11e-4d63-b1ae-106ef026a33d",
    authorUserId: "5bffabdd-0b8c-4e45-a0a5-6be8c8f11db9",
    content: "This is a test comment!",
  };

  // Mock return values
  const regularMocks = {
    publicComment: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    publicComment: {
      create: regularMocks.publicComment.create,
    },
  };

  const transactionMocks = {
    publicComment: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    publicComment: {
      create: transactionMocks.publicComment.create,
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
    await insertPublicComment(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.publicComment.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.publicComment.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertPublicComment(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.publicComment.create).not.toHaveBeenCalled();
    expect(transactionMocks.publicComment.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
