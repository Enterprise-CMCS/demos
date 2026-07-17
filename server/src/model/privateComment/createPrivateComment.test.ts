// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";

// Functions under test
import { createPrivateComment } from "./createPrivateComment";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  validateUserPermittedToMakePrivateComment: vi.fn(),
}));

vi.mock("./queries", () => ({
  insertPrivateComment: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePrivateComment } from ".";
import { insertPrivateComment } from "./queries";

describe("createPrivateComment", () => {
  // Test inputs
  const testDeliverableId = "7dad9b78-9c38-4bca-8985-f292edb4d12d";
  const testComment = "Free insulin is a good policy proposal!";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "f41d7a0b-49d7-4f9e-b079-2e97a21c294d",
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
    await createPrivateComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(prisma).toHaveBeenCalledOnce();
  });

  it("should call the validator to verify the inputs", async () => {
    await createPrivateComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(validateUserPermittedToMakePrivateComment).toHaveBeenCalledExactlyOnceWith(testContext);
  });

  it("should insert the comment", async () => {
    await createPrivateComment(testDeliverableId, testComment, testContext as GraphQLContext);
    expect(insertPrivateComment).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        authorUserId: testContext.user!.id,
        authorPersonTypeId: testContext.user!.personTypeId,
        content: testComment,
      },
      mockTransaction
    );
  });
});
