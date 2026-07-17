// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";

// Functions under test
import { createPublicComment } from "./createPublicComment";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  validateUserPermittedToMakePublicComment: vi.fn(),
}));

vi.mock("./queries", () => ({
  insertPublicComment: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePublicComment } from ".";
import { insertPublicComment } from "./queries";

describe("createPublicComment", () => {
  // Test inputs
  const testDeliverableId = "e1b4a166-9a23-480c-9ac8-d5361414dfd0";
  const testComment = "Free insulin is a good policy proposal!";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "03728c69-1676-4cb5-8b31-c98b24cbda76",
      personTypeId: "demos-cms-user",
    },
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should create a transaction whenever it is called", async () => {
    await createPublicComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(prisma).toHaveBeenCalledOnce();
  });

  it("should call the validator to verify the inputs", async () => {
    await createPublicComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(validateUserPermittedToMakePublicComment).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      testContext,
      mockTransaction
    );
  });

  it("should insert the comment", async () => {
    await createPublicComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(insertPublicComment).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        authorUserId: testContext.user!.id,
        content: testComment,
      },
      mockTransaction
    );
  });
});
