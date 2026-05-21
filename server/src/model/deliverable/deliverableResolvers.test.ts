// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
  User as PrismaUser,
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { ContextUser, GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";
import {
  ApproveDeliverableExtensionInput,
  CreateDeliverableInput,
  DateTimeOrLocalDate,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  DenyDeliverableExtensionInput,
  RequestDeliverableExtensionInput,
  UpdateDeliverableInput,
} from "../../types";
import { DeliverableDemonstrationTypeQueryResult } from "../deliverableDemonstrationType/queries";

// Functions under test
import {
  resolveDeliverable,
  resolveManyDeliverables,
  resolveDeliverableType,
  resolveDeliverableStatus,
  resolveDeliverableDueDateType,
  resolveDemonstration,
  deliverableResolvers,
} from "./deliverableResolvers";

// Mock imports
vi.mock(".", () => ({
  approveDeliverableExtension: vi.fn(),
  completeDeliverable: vi.fn(),
  createDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  denyDeliverableExtension: vi.fn(),
  selectDeliverable: vi.fn(),
  selectDeliverableOrThrow: vi.fn(),
  selectManyDeliverables: vi.fn(),
  getDeliverable: vi.fn(),
  getManyDeliverables: vi.fn(),
  requestDeliverableExtension: vi.fn(),
  requestDeliverableResubmission: vi.fn(),
  startDeliverableReview: vi.fn(),
  submitDeliverable: vi.fn(),
  updateDeliverable: vi.fn(),
}));

vi.mock("../thing", () => ({
  resolveThing: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../user/queries", () => ({
  selectUserOrThrow: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("../deliverableDemonstrationType/queries", () => ({
  selectManyDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverableAction", () => ({
  getFormattedDeliverableActions: vi.fn(),
}));

vi.mock("../deliverableExtension/queries", () => ({
  selectManyDeliverableExtensions: vi.fn(),
}));

vi.mock("../publicComment/queries", () => ({
  selectManyPublicComments: vi.fn(),
}));

vi.mock("../privateComment/queries", () => ({
  selectManyPrivateComments: vi.fn(),
}));

import {
  approveDeliverableExtension,
  completeDeliverable,
  createDeliverable,
  deleteDeliverable,
  denyDeliverableExtension,
  requestDeliverableExtension,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
  selectDeliverable,
  selectManyDeliverables,
  selectDeliverableOrThrow,
  getDeliverable,
  getManyDeliverables,
} from ".";
import { getApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { getManyDocuments } from "../document";
import { selectManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType/queries";
import { getFormattedDeliverableActions } from "../deliverableAction";
import { selectManyDeliverableExtensions } from "../deliverableExtension/queries";
import { selectManyPublicComments } from "../publicComment/queries";
import { selectManyPrivateComments } from "../privateComment/queries";

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
  const testDocumentPendingUploadInfo = {
    parentType: {
      name: "DocumentPendingUpload",
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
  const testDocumentPendingUploadWithDeliverableParent: Partial<PrismaDocumentPendingUpload> = {
    deliverableId: testDeliverableId,
  };
  const testDocumentWithoutDeliverableParent: Partial<PrismaDocument> = {
    deliverableId: null,
  };
  const testDocumentPendingUploadWithoutDeliverableParent: Partial<PrismaDocumentPendingUpload> = {
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
          deliverableId: testDeliverableId,
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

  describe("Mutation.approveDeliverableExtension", () => {
    it("calls approveDeliverableExtension with appropriate arguments", async () => {
      const testInput: ApproveDeliverableExtensionInput = {
        deliverableExtensionId: "e0b332b7-2ecd-4058-a484-a3ecbb81344e",
        newDueDate: "2025-11-13" as DateTimeOrLocalDate,
      };

      await deliverableResolvers.Mutation.approveDeliverableExtension(
        undefined,
        {
          deliverableId: testDeliverableId,
          input: testInput,
        },
        testContext as GraphQLContext
      );
      expect(approveDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testInput,
        testContext
      );
    });
  });

  describe("Mutation.denyDeliverableExtension", () => {
    it("calls denyDeliverableExtension with appropriate arguments", async () => {
      const testInput: DenyDeliverableExtensionInput = {
        deliverableExtensionId: "e0b332b7-2ecd-4058-a484-a3ecbb81344e",
        details: "This is denied",
      };

      await deliverableResolvers.Mutation.denyDeliverableExtension(
        undefined,
        {
          deliverableId: testDeliverableId,
          input: testInput,
        },
        testContext as GraphQLContext
      );
      expect(denyDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId,
        testInput,
        testContext
      );
    });
  });

  describe("Mutation.deleteDeliverable", () => {
    it("calls deleteDeliverable with appropriate arguments", async () => {
      await deliverableResolvers.Mutation.deleteDeliverable(
        undefined,
        {
          id: testDeliverableId,
        },
        testContext as GraphQLContext
      );
      expect(deleteDeliverable).toHaveBeenCalledExactlyOnceWith(testDeliverableId, testContext);
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

  describe("Deliverable.cmsOwner", () => {
    it("delegates to `userData/queries.selectUserOrThrow`", async () => {
      const mockDeliverable = { cmsOwnerUserId: testUserId } as PrismaDeliverable;
      await deliverableResolvers.Deliverable.cmsOwner(mockDeliverable);
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith({ id: testUserId });
    });
  });

  describe("resolveDeliverable", () => {
    const testCommentInfo = {
      parentType: {
        name: "DeliverableComment",
      },
    };

    it("should throw if given something not supported", async () => {
      await expect(
        resolveDeliverable(
          testDocumentWithDeliverableParent as PrismaDocument,
          {} as unknown,
          mockContext as GraphQLContext,
          testDemonstrationInfo as GraphQLResolveInfo
        )
      ).rejects.toThrow("Unsupported parent type: Demonstration");
      expect(selectDeliverableOrThrow).not.toHaveBeenCalled();
    });

    describe("Parent: Document", () => {
      it("should not query and return null if there is no deliverable ID", async () => {
        const result = await resolveDeliverable(
          testDocumentWithoutDeliverableParent as PrismaDocument,
          {} as unknown,
          mockContext as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        );
        expect(result).toBeNull();
        expect(selectDeliverable).not.toHaveBeenCalled();
      });

      it("should query if there is a deliverable ID", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: "abc123",
          statusId: "Upcoming",
        };
        vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        const result = await resolveDeliverable(
          testDocumentWithDeliverableParent as PrismaDocument,
          {} as unknown,
          mockContext as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        );
        expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith({
          id: testDeliverableId,
        });
        expect(result).toBe(mockDeliverable);
      });

      it("should not throw even if deliverable was not found (it is deleted)", async () => {
        vi.mocked(selectDeliverable).mockResolvedValue(null);

        const result = await resolveDeliverable(
          testDocumentWithDeliverableParent as PrismaDocument,
          {} as unknown,
          mockContext as GraphQLContext,
          testDocumentInfo as GraphQLResolveInfo
        );
        expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith({
          id: testDeliverableId,
        });
        expect(result).toBeNull();
      });
    });

    describe("Parent: DocumentPendingUpload", () => {
      it("should not query and return null if there is no deliverable ID", async () => {
        const result = await resolveDeliverable(
          testDocumentPendingUploadWithoutDeliverableParent as PrismaDocumentPendingUpload,
          {} as unknown,
          {} as GraphQLContext,
          testDocumentPendingUploadInfo as GraphQLResolveInfo
        );
        expect(result).toBeNull();
        expect(selectDeliverable).not.toHaveBeenCalled();
      });

      it("should query if there is a deliverable ID", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: "abc123",
          statusId: "Upcoming",
        };
        vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        const result = await resolveDeliverable(
          testDocumentPendingUploadWithDeliverableParent as PrismaDocumentPendingUpload,
          {} as unknown,
          {} as GraphQLContext,
          testDocumentPendingUploadInfo as GraphQLResolveInfo
        );
        expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith({
          id: testDeliverableId,
        });
        expect(result).toBe(mockDeliverable);
      });
    });

    describe("Parent: PublicComment", () => {
      const testPublicComment: Partial<PrismaPublicComment> = {
        deliverableId: "0fa61577-5eb2-42a3-994b-34f6c8a8aa2a",
        content: "This is content!",
      };

      it("should query for the deliverable", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: "abc123",
          statusId: "Upcoming",
        };
        vi.mocked(selectDeliverableOrThrow).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        const result = await resolveDeliverable(
          testPublicComment as PrismaPublicComment,
          {} as unknown,
          mockContext as GraphQLContext,
          testCommentInfo as GraphQLResolveInfo
        );
        expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith({
          id: testPublicComment.deliverableId,
        });
        expect(result).toBe(mockDeliverable);
      });
    });

    describe("Parent: PrivateComment", () => {
      const testPrivateComment: Partial<PrismaPrivateComment> = {
        deliverableId: "15f7d31f-4840-466e-888b-31e2543ce616",
        content: "This is private content, ssh!",
      };

      it("should query for the deliverable", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: "abc123",
          statusId: "Upcoming",
        };
        vi.mocked(selectDeliverableOrThrow).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        const result = await resolveDeliverable(
          testPrivateComment as PrismaPrivateComment,
          {} as unknown,
          mockContext as GraphQLContext,
          testCommentInfo as GraphQLResolveInfo
        );
        expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith({
          id: testPrivateComment.deliverableId,
        });
        expect(result).toBe(mockDeliverable);
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
      expect(selectManyDeliverables).not.toHaveBeenCalled();
    });

    describe("Parent: Demonstration", () => {
      it("should query for a demonstration ID", async () => {
        await resolveManyDeliverables(
          testDemonstrationParent as PrismaDemonstration,
          {} as unknown,
          mockContext as GraphQLContext,
          testDemonstrationInfo as GraphQLResolveInfo
        );
        expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith({
          demonstrationId: testDemonstrationId,
        });
      });
    });

    describe("Parent: User", () => {
      it("should query for a owner user ID", async () => {
        await resolveManyDeliverables(
          testUserParent as PrismaUser,
          {} as unknown,
          mockContext as GraphQLContext,
          testUserInfo as GraphQLResolveInfo
        );
        expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith({
          cmsOwnerUserId: testUserId,
        });
      });
    });
  });

  describe("Query.deliverables", () => {
    it("should query all the deliverables", async () => {
      await deliverableResolvers.Query.deliverables(
        undefined,
        undefined,
        mockContext as GraphQLContext
      );
      expect(getManyDeliverables).toHaveBeenCalledExactlyOnceWith({}, mockUser);
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

  describe("deliverableResolvers", () => {
    describe("Query.deliverable", () => {
      it("should call getDeliverable to retrieve the deliverable", async () => {
        await deliverableResolvers.Query.deliverable(
          undefined,
          { id: "an-id" },
          mockContext as GraphQLContext
        );
        expect(getDeliverable).toHaveBeenCalledExactlyOnceWith({ id: "an-id" }, mockUser);
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
        vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValue(
          mockDeliverableDemonstrationTypeQueryResult
        );

        const result = await deliverableResolvers.Deliverable.demonstrationTypes(
          testDeliverable as PrismaDeliverable
        );
        expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith({
          deliverableId: testDeliverableId,
        });
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

    describe("Deliverable.extensionRequests", () => {
      it("should query the extension requests of the parent deliverable", async () => {
        await deliverableResolvers.Deliverable.extensionRequests(
          testDeliverable as PrismaDeliverable
        );
        expect(selectManyDeliverableExtensions).toHaveBeenCalledExactlyOnceWith({
          deliverableId: testDeliverableId,
        });
      });
    });

    describe("Deliverable.publicComments", () => {
      it("should query the public comments of the parent deliverable", async () => {
        await deliverableResolvers.Deliverable.publicComments(testDeliverable as PrismaDeliverable);
        expect(selectManyPublicComments).toHaveBeenCalledExactlyOnceWith({
          deliverableId: testDeliverableId,
        });
      });
    });

    describe("Deliverable.privateComments", () => {
      it("should query the private comments of the parent deliverable", async () => {
        await deliverableResolvers.Deliverable.privateComments(
          testDeliverable as PrismaDeliverable
        );
        expect(selectManyPrivateComments).toHaveBeenCalledExactlyOnceWith({
          deliverableId: testDeliverableId,
        });
      });
    });
  });
});
