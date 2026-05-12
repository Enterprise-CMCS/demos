// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";

// Functions under test
import { validateUserPermittedToMakePublicComment } from "./validateUserPermittedToMakePublicComment";

// Mock imports
vi.mock("../deliverable", () => ({
  isStatePointOfContactOnDeliverableDemonstration: vi.fn(),
}));

import { isStatePointOfContactOnDeliverableDemonstration } from "../deliverable";

describe("validateUserPermittedToMakePublicComment", () => {
  // Test inputs
  const testDeliverableId = "624fbb8f-195c-477f-963b-d4197cb2f8c6";

  // Mock transaction
  const mockTransaction = "I'm a transaction!" as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should not call the state point of contact checker for CMS users or admins", async () => {
    const testContext1: DeepPartial<GraphQLContext> = {
      user: {
        id: "9f8eccba-2829-4698-a18c-9751e7157dc3",
        personTypeId: "demos-cms-user",
      },
    };
    const testContext2: DeepPartial<GraphQLContext> = {
      user: {
        id: "9f8eccba-2829-4698-a18c-9751e7157dc3",
        personTypeId: "demos-admin",
      },
    };

    await validateUserPermittedToMakePublicComment(
      testDeliverableId,
      testContext1 as GraphQLContext,
      mockTransaction
    );
    await validateUserPermittedToMakePublicComment(
      testDeliverableId,
      testContext2 as GraphQLContext,
      mockTransaction
    );
    expect(isStatePointOfContactOnDeliverableDemonstration).not.toHaveBeenCalled();
  });

  it("should call the state point of contact checker for state users", async () => {
    vi.mocked(isStatePointOfContactOnDeliverableDemonstration).mockResolvedValue(true);
    const testContext: DeepPartial<GraphQLContext> = {
      user: {
        id: "9f8eccba-2829-4698-a18c-9751e7157dc3",
        personTypeId: "demos-state-user",
      },
    };

    await validateUserPermittedToMakePublicComment(
      testDeliverableId,
      testContext as GraphQLContext,
      mockTransaction
    );
    expect(isStatePointOfContactOnDeliverableDemonstration).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      testContext.user!.id,
      mockTransaction
    );
  });

  it("should throw if a state user is not assigned to the related demonstration", async () => {
    vi.mocked(isStatePointOfContactOnDeliverableDemonstration).mockResolvedValue(false);
    const testContext: DeepPartial<GraphQLContext> = {
      user: {
        id: "9f8eccba-2829-4698-a18c-9751e7157dc3",
        personTypeId: "demos-state-user",
      },
    };

    try {
      await validateUserPermittedToMakePublicComment(
        testDeliverableId,
        testContext as GraphQLContext,
        mockTransaction
      );
      throw new Error(
        "Expected validateUserPermittedToMakePublicComment to throw, but it did not."
      );
    } catch (e) {
      const error = e as Error;
      expect(error.message).toBe(
        `The user with ID ${testContext.user!.id} is not permitted to create a comment ` +
          `on deliverable ${testDeliverableId}; user is a state user who is not a State Point of Contact on ` +
          "the associated demonstration."
      );
    }
  });
});
