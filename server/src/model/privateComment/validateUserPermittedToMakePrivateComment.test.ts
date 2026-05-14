// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";

// Functions under test
import { validateUserPermittedToMakePrivateComment } from "./validateUserPermittedToMakePrivateComment";

// Mock imports

describe("validateUserPermittedToMakePrivateComment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should not throw if the user is an admin or a CMS user", () => {
    const testContext1: DeepPartial<GraphQLContext> = {
      user: {
        id: "1c55aaeb-b81d-43d3-bdec-0a31061fc45a",
        personTypeId: "demos-cms-user",
      },
    };
    const testContext2: DeepPartial<GraphQLContext> = {
      user: {
        id: "1c55aaeb-b81d-43d3-bdec-0a31061fc45a",
        personTypeId: "demos-admin",
      },
    };

    validateUserPermittedToMakePrivateComment(testContext1 as GraphQLContext);
    validateUserPermittedToMakePrivateComment(testContext2 as GraphQLContext);
  });

  it("should throw if the user is a state user", () => {
    const testContext: DeepPartial<GraphQLContext> = {
      user: {
        id: "1c55aaeb-b81d-43d3-bdec-0a31061fc45a",
        personTypeId: "demos-state-user",
      },
    };

    try {
      validateUserPermittedToMakePrivateComment(testContext as GraphQLContext);
      throw new Error(
        "Expected validateUserPermittedToMakePrivateComment to throw, but it did not."
      );
    } catch (e) {
      const error = e as Error;
      expect(error.message).toBe(
        `The user with ID ${testContext.user!.id} is not permitted to create a private comment; incorrect user type.`
      );
    }
  });
});
