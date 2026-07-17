// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";

// Functions under test
import { privateCommentResolvers } from "./privateCommentResolvers";

// Mock imports
vi.mock(".", () => ({
  createPrivateComment: vi.fn(),
}));

import { createPrivateComment } from ".";

describe("privateCommentResolvers", () => {
  const testDeliverableId = "e0709359-8016-4106-9490-844ac9a0e6ea";
  const testComment = "Free insulin is a good policy proposal!";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "eb43833e-a8de-438c-a06a-4837c2f90373",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Mutation.createPrivateComment", () => {
    it("should call the createPrivateComment function", async () => {
      await privateCommentResolvers.Mutation.createPrivateComment(
        undefined,
        {
          deliverableId: testDeliverableId,
          comment: testComment,
        },
        testContext as GraphQLContext
      );

      expect(createPrivateComment).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testComment,
        testContext
      );
    });
  });
});
