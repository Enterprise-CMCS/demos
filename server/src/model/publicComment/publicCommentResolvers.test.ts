// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";

// Functions under test
import { publicCommentResolvers } from "./publicCommentResolvers";

// Mock imports
vi.mock("../deliverable", () => ({
  resolveDeliverable: vi.fn(),
}));

vi.mock("../user", () => ({
  getUser: vi.fn(),
}));

import { resolveDeliverable } from "../deliverable";
import { getUser } from "../user";

describe("publicCommentResolvers", () => {
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

  describe("DeliverableComment.authorUser", () => {
    it("should query the author of the comment for public comments", async () => {
      await publicCommentResolvers.DeliverableComment.authorUser(
        testPublicComment as PrismaPublicComment,
        undefined,
        testContext as GraphQLContext
      );
      expect(getUser).toHaveBeenCalledExactlyOnceWith(
        { id: testPublicComment.authorUserId },
        testContext.user
      );
    });

    it("should query the author of the comment for private comments", async () => {
      await publicCommentResolvers.DeliverableComment.authorUser(
        testPrivateComment as PrismaPrivateComment,
        undefined,
        testContext as GraphQLContext
      );
      expect(getUser).toHaveBeenCalledExactlyOnceWith(
        { id: testPrivateComment.authorUserId },
        testContext.user
      );
    });
  });
});
