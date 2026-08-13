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

vi.mock("../email", () => ({
  dispatchPublicCommentAddedEmail: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePublicComment } from ".";
import { insertPublicComment } from "./queries";
import { dispatchPublicCommentAddedEmail } from "../email";

describe("createPublicComment", () => {
  // Test inputs
  const testDeliverableId = "e1b4a166-9a23-480c-9ac8-d5361414dfd0";
  const testComment = "Free insulin is a good policy proposal!";
  const publicCommentId = "7a1e395f-2abe-4cc7-bf9f-14548513c92c";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "03728c69-1676-4cb5-8b31-c98b24cbda76",
      personTypeId: "demos-cms-user",
    },
  };

  // Mock transaction
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };
  const mockTransactionClient = {
    deliverable: {
      findUniqueOrThrow: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(insertPublicComment).mockResolvedValue({ id: publicCommentId } as any);
    mockTransactionClient.deliverable.findUniqueOrThrow.mockResolvedValue({
      statusId: "Approved",
    });
    mockPrismaClient.$transaction.mockImplementation((callback) =>
      callback(mockTransactionClient)
    );
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
      mockTransactionClient
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
      mockTransactionClient
    );
  });

  it("queues an email after a public comment is created", async () => {
    await createPublicComment(testDeliverableId, testComment, testContext as GraphQLContext);

    expect(dispatchPublicCommentAddedEmail).toHaveBeenCalledExactlyOnceWith({
      deliverableId: testDeliverableId,
      publicCommentId,
      triggeredByUserId: testContext.user!.id,
    });
  });

  it("does not queue an email for an incomplete deliverable", async () => {
    mockTransactionClient.deliverable.findUniqueOrThrow.mockResolvedValue({
      statusId: "Submitted",
    });

    await createPublicComment(testDeliverableId, testComment, testContext as GraphQLContext);

    expect(dispatchPublicCommentAddedEmail).not.toHaveBeenCalled();
  });
});
