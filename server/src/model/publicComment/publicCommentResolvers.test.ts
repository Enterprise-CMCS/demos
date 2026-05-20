// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";

// Functions under test
import { publicCommentResolvers } from "./publicCommentResolvers";

// Mock imports
vi.mock("../user/queries", () => ({
  selectUserOrThrow: vi.fn(),
}));

vi.mock(".", () => ({
  createPublicComment: vi.fn(),
}));

import { selectUserOrThrow } from "../user/queries";
import { createPublicComment } from ".";

describe("publicCommentResolvers", () => {
  const testDeliverableId = "5090af2f-8bd5-4fba-834d-28483670a674";
  const testComment = "Free insulin is a good policy proposal!";
  const testPublicComment: Partial<PrismaPublicComment> = {
    id: "8c11d5c0-f51e-4401-bb72-072a69443f30",
    authorUserId: "c83a9d0c-4de3-46af-b4f4-fd0cc214dadb",
  };
  const testPrivateComment: Partial<PrismaPrivateComment> = {
    id: "7f67481d-6b2d-46c2-8ba7-352d990c6427",
    authorUserId: "f6c3583f-5036-4cbb-b0a5-495da39e196f",
  };
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "940eb632-e307-439f-97ff-62dc42abbecd",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Mutation.createPublicComment", () => {
    it("should call the createPublicComment function", async () => {
      await publicCommentResolvers.Mutation.createPublicComment(
        undefined,
        {
          deliverableId: testDeliverableId,
          comment: testComment,
        },
        testContext as GraphQLContext
      );

      expect(createPublicComment).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testComment,
        testContext
      );
    });
  });

  describe("DeliverableComment.authorUser", () => {
    it("should query the author of the comment for public comments", async () => {
      await publicCommentResolvers.DeliverableComment.authorUser(
        testPublicComment as PrismaPublicComment
      );
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith({
        id: testPublicComment.authorUserId,
      });
    });

    it("should query the author of the comment for private comments", async () => {
      await publicCommentResolvers.DeliverableComment.authorUser(
        testPrivateComment as PrismaPrivateComment
      );
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith({
        id: testPrivateComment.authorUserId,
      });
    });
  });
});
