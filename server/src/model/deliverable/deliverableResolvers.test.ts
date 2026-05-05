// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { DeepPartial } from "../../testUtilities";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  User as PrismaUser,
} from "@prisma/client";
import { ContextUser, GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";
import {
  CreateDeliverableInput,
  DateTimeOrLocalDate,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  RequestDeliverableExtensionInput,
  UpdateDeliverableInput,
} from "../../types";
import { DeliverableDemonstrationTypeQueryResult } from "../deliverableDemonstrationType/queries";

// Functions under test
import {
  resolveDeliverable,
  resolveManyDeliverables,
  queryDeliverables,
  resolveDeliverableType,
  resolveDeliverableStatus,
  resolveDeliverableDueDateType,
  resolveDemonstration,
  resolveDeliverableCmsOwner,
  deliverableResolvers,
} from "./deliverableResolvers";

// Mock imports
vi.mock(".", () => ({
  completeDeliverable: vi.fn(),
  createDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  getManyDeliverables: vi.fn(),
  requestDeliverableExtension: vi.fn(),
  requestDeliverableResubmission: vi.fn(),
  startDeliverableReview: vi.fn(),
  submitDeliverable: vi.fn(),
  updateDeliverable: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../user", () => ({
  getUser: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("../deliverableDemonstrationType", () => ({
  getManyDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverableAction", () => ({
  getFormattedDeliverableActions: vi.fn(),
}));

import {
  completeDeliverable,
  createDeliverable,
  getDeliverable,
  getManyDeliverables,
  requestDeliverableExtension,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
} from ".";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getManyDocuments } from "../document";
import { getManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";
import { getFormattedDeliverableActions } from "../deliverableAction";

describe("deliverableResolvers", () => {
  const testDeliverableId = "82ef9a17-e8b9-48ab-9aaf-3d1787822b13";
  const testDeliverableType: DeliverableType = "Close Out Report";
  const testDeliverableStatus: DeliverableStatus = "Accepted";
  const testDeliverableDueDateType: DeliverableDueDateType = "Normal";
  const testDemonstrationId = "a14f1ada-e12c-4296-a4e6-4f25b515a279";
  const testUserId = "1ab53226-6a12-46c9-925c-4f3911b48f4c";
  const testDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    deliverableTypeId: testDeliverableType,
    demonstrationId: testDemonstrationId,
    statusId: testDeliverableStatus,
    dueDateTypeId: testDeliverableDueDateType,
    cmsOwnerUserId: testUserId,
  };

  const testDocumentInfo = {
    parentType: {
      name: "Document",
    },
  };
  const testDemonstrationInfo = {
    parentType: {
      name: "Demonstration",
    },
  };
  const testUserInfo = {
    parentType: {
      name: "User",
    },
  };

  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "testUserId",
    },
  };

  const testDocumentWithDeliverableParent: Partial<PrismaDocument> = {
    deliverableId: testDeliverableId,
  };
  const testDocumentWithoutDeliverableParent: Partial<PrismaDocument> = {
    deliverableId: null,
  };
  const testDemonstrationParent: Partial<PrismaDemonstration> = {
    id: testDemonstrationId,
  };
  const testUserParent: Partial<PrismaUser> = {
    id: testUserId,
  };

  const mockUser = {} as unknown as ContextUser;
  const mockContext: GraphQLContext = {
    user: mockUser,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Mutation.submitDeliverable", () => {
    it("calls submitDeliverable with appropriate arguments", async () => {
      await deliverableResolvers.Mutation.submitDeliverable(
        undefined,
        { id: testDeliverableId },
        testContext as GraphQLContext
      );
      expect(submitDeliverable).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testContext as GraphQLContext
      );
    });
  });

  describe("Mutation.startDeliverableReview", () => {
    it("calls startDeliverableReview with appropriate arguments", async () => {
      await deliverableResolvers.Mutation.startDeliverableReview(
        undefined,
        { id: testDeliverableId },
        testContext as GraphQLContext
      );
      expect(startDeliverableReview).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testContext
      );
    });
  });

  describe("Mutation.completeDeliverable", () => {
    it("calls completeDeliverable with appropriate arguments", async () => {
      await deliverableResolvers.Mutation.completeDeliverable(
        undefined,
        { id: testDeliverableId, finalStatus: "Approved" },
        testContext as GraphQLContext
      );
      expect(completeDeliverable).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        "Approved",
        testContext
      );
    });
  });

  describe("Mutation.requestDeliverableResubmission", () => {
    it("calls requestDeliverableResubmission with appropriate arguments", async () => {
      const testInput = {
        details: "A change is gonna come",
        newDueDate: "2025-11-13" as DateTimeOrLocalDate,
      };

      await deliverableResolvers.Mutation.requestDeliverableResubmission(
        undefined,
        {
          id: testDeliverableId,
          input: testInput,
        },
        testContext as GraphQLContext
      );
      expect(requestDeliverableResubmission).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testInput,
        testContext
      );
    });
  });

  describe("Mutation.requestDeliverableExtension", () => {
    it("calls requestDeliverableExtension with appropriate arguments", async () => {
      const testInput: RequestDeliverableExtensionInput = {
        reason: "COVID-19",
        details: "A change is gonna come",
        requestedDueDate: "2025-11-13" as DateTimeOrLocalDate,
      };

      await deliverableResolvers.Mutation.requestDeliverableExtension(
        undefined,
        {
          id: testDeliverableId,
          input: testInput,
        },
        testContext as GraphQLContext
      );
      expect(requestDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testInput,
        testContext
      );
    });
  });

  describe("Deliverable.cmsDocuments", () => {
    it("delegates to `documentData.getManyDocuments` with CMS filter as true", async () => {
      const mockDeliverable = { id: testDeliverableId } as PrismaDeliverable;
      await deliverableResolvers.Deliverable.cmsDocuments(
        mockDeliverable,
        undefined,
        testContext as GraphQLContext
      );
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [{ deliverableId: testDeliverableId }, { deliverableIsCmsAttachedFile: true }],
        },
        testContext.user
      );
    });
  });

  describe("Deliverable.stateDocuments", () => {
    it("delegates to `documentData.getManyDocuments` with CMS filter as false", async () => {
      const mockDeliverable = { id: testDeliverableId } as PrismaDeliverable;
      await deliverableResolvers.Deliverable.stateDocuments(
        mockDeliverable,
        undefined,
        testContext as GraphQLContext
      );
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [{ deliverableId: testDeliverableId }, { deliverableIsCmsAttachedFile: false }],
        },
        testContext.user
      );
    });
  });

  describe("resolveDeliverable", () => {
    it("should throw if given something not supported", async () => {
      await expect(
        resolveDeliverable(
          testDocumentWithDeliverableParent as PrismaDocument,
          {} as unknown,
          {} as GraphQLContext,
          testDemonstrationInfo as GraphQLResolveInfo
        )
      ).rejects.toThrow("Unsupported parent type: Demonstration");
      expect(getDeliverable).not.toHaveBeenCalled();
    });

    describe("Parent: Document", () => {
      it("should not query and return null if there is no deliverable ID", async () => {
        const result = await resolveDeliverable(
          testDocumentWithoutDeliverableParent as PrismaDocument,
          {} as unknown,
          {} as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        );
        expect(result).toBeNull();
        expect(getDeliverable).not.toHaveBeenCalled();
      });

      it("should query if there is a deliverable ID", async () => {
        await resolveDeliverable(
          testDocumentWithDeliverableParent as PrismaDocument,
          {} as unknown,
          {} as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        );
        expect(getDeliverable).toHaveBeenCalledExactlyOnceWith({ id: testDeliverableId });
      });
    });
  });

  describe("resolveManyDeliverables", () => {
    it("should throw if given something not supported", async () => {
      await expect(
        resolveManyDeliverables(
          testDemonstrationParent as PrismaDemonstration,
          {} as unknown,
          {} as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        )
      ).rejects.toThrow("Unsupported parent type: Document");
      expect(getManyDeliverables).not.toHaveBeenCalled();
    });

    describe("Parent: Demonstration", () => {
      it("should query for a demonstration ID", async () => {
        await resolveManyDeliverables(
          testDemonstrationParent as PrismaDemonstration,
          {} as unknown,
          {} as GraphQLContext,
          testDemonstrationInfo as GraphQLResolveInfo
        );
        expect(getManyDeliverables).toHaveBeenCalledExactlyOnceWith({
          demonstrationId: testDemonstrationId,
        });
      });
    });

    describe("Parent: User", () => {
      it("should query for a owner user ID", async () => {
        await resolveManyDeliverables(
          testUserParent as PrismaUser,
          {} as unknown,
          {} as GraphQLContext,
          testUserInfo as GraphQLResolveInfo
        );
        expect(getManyDeliverables).toHaveBeenCalledExactlyOnceWith({
          cmsOwnerUserId: testUserId,
        });
      });
    });
  });

  describe("queryDeliverables", () => {
    it("should query all the deliverables", async () => {
      await queryDeliverables();
      expect(getManyDeliverables).toHaveBeenCalledExactlyOnceWith();
    });
  });

  describe("resolveDeliverableType", () => {
    it("should return the deliverable type from a deliverable", () => {
      const result = resolveDeliverableType(testDeliverable as PrismaDeliverable);
      expect(result).toBe(testDeliverableType);
    });
  });

  describe("resolveDeliverableStatus", () => {
    it("should return the deliverable status from a deliverable", () => {
      const result = resolveDeliverableStatus(testDeliverable as PrismaDeliverable);
      expect(result).toBe(testDeliverableStatus);
    });
  });

  describe("resolveDeliverableDueDateType", () => {
    it("should return the deliverable due date type from a deliverable", () => {
      const result = resolveDeliverableDueDateType(testDeliverable as PrismaDeliverable);
      expect(result).toBe(testDeliverableDueDateType);
    });
  });

  describe("resolveDemonstration", () => {
    it("should query the demonstration of the parent deliverable", async () => {
      await resolveDemonstration(testDeliverable as PrismaDeliverable);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testDemonstrationId, {
        applicationTypeId: "Demonstration",
      });
    });
  });

  describe("resolveDeliverableCmsOwner", () => {
    it("should query the CMS owner user of the parent deliverable", async () => {
      await resolveDeliverableCmsOwner(testDeliverable as PrismaDeliverable);
      expect(getUser).toHaveBeenCalledExactlyOnceWith({
        id: testUserId,
      });
    });
  });

  describe("deliverableResolvers", () => {
    describe("Query.deliverable", () => {
      it("should call getDeliverable to retrieve the deliverable", async () => {
        await deliverableResolvers.Query.deliverable(undefined, { id: "an-id" });
        expect(getDeliverable).toHaveBeenCalledExactlyOnceWith({ id: "an-id" });
      });
    });

    describe("Mutation.createDeliverable", () => {
      it("should call the createDeliverable function with the right arguments", async () => {
        const testInput: CreateDeliverableInput = {
          name: "A name!",
          deliverableType: "Close Out Report",
          demonstrationId: testDemonstrationId,
          cmsOwnerUserId: "161f3a85-7b6d-4217-abec-93494db3a207",
          dueDate: "2025-11-31" as DateTimeOrLocalDate,
        };

        await deliverableResolvers.Mutation.createDeliverable(
          {},
          { input: testInput },
          {} as GraphQLContext
        );
        expect(createDeliverable).toHaveBeenCalledExactlyOnceWith(testInput, {});
      });
    });

    describe("Mutation.updateDeliverable", () => {
      it("should call the updateDeliverable function with the right arguments", async () => {
        const testInput: UpdateDeliverableInput = {
          name: "A name!",
          cmsOwnerUserId: "161f3a85-7b6d-4217-abec-93494db3a207",
        };

        await deliverableResolvers.Mutation.updateDeliverable(
          {},
          { id: testDeliverableId, input: testInput },
          {} as GraphQLContext
        );
        expect(updateDeliverable).toHaveBeenCalledExactlyOnceWith(testDeliverableId, testInput, {});
      });
    });

    describe("Deliverable.demonstrationTypes", () => {
      it("should query the demonstration types of the parent deliverable", async () => {
        const mockDeliverableDemonstrationTypeQueryResult: DeliverableDemonstrationTypeQueryResult[] =
          [
            {
              demonstrationTypeTagAssignment: {
                tag: {
                  statusId: "Approved",
                  tagNameId: "Free Insulin",
                },
              },
            },
            {
              demonstrationTypeTagAssignment: {
                tag: {
                  statusId: "Unapproved",
                  tagNameId: "Vitamin A Supplementation for Newborns",
                },
              },
            },
          ] as DeliverableDemonstrationTypeQueryResult[];
        vi.mocked(getManyDeliverableDemonstrationTypes).mockResolvedValue(
          mockDeliverableDemonstrationTypeQueryResult
        );

        const result = await deliverableResolvers.Deliverable.demonstrationTypes(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(getManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
          { deliverableId: testDeliverableId },
          mockUser
        );
        expect(result).toStrictEqual([
          {
            approvalStatus: "Approved",
            tagName: "Free Insulin",
          },
          {
            approvalStatus: "Unapproved",
            tagName: "Vitamin A Supplementation for Newborns",
          },
        ]);
      });
    });

    describe("Deliverable.deliverableActions", () => {
      it("should query the deliverable actions of the parent deliverable", async () => {
        await deliverableResolvers.Deliverable.deliverableActions(
          testDeliverable as PrismaDeliverable
        );
        expect(getFormattedDeliverableActions).toHaveBeenCalledExactlyOnceWith(testDeliverableId);
      });
    });
  });
});
