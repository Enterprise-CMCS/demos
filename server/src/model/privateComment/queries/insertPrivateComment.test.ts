// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { AllowedPrivateCommenters, InsertPrivateCommentInput } from ".";

// Functions under test
import { insertPrivateComment } from "./insertPrivateComment";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertPrivateComment", () => {
  // Test inputs
  const testInput: InsertPrivateCommentInput = {
    deliverableId: "316cad98-643a-4c47-bd41-199625de6964",
    authorUserId: "1578fa6e-db49-4359-a9aa-d10dc066ff5f",
    authorPersonTypeId: "demos-admin" satisfies AllowedPrivateCommenters,
    content: "We can probably be more aggresive about the free insulin program",
  };

  // Mock return values
  const regularMocks = {
    privateComment: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    privateComment: {
      create: regularMocks.privateComment.create,
    },
  };

  const transactionMocks = {
    privateComment: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    privateComment: {
      create: transactionMocks.privateComment.create,
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
    await insertPrivateComment(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.privateComment.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.privateComment.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertPrivateComment(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.privateComment.create).not.toHaveBeenCalled();
    expect(transactionMocks.privateComment.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
