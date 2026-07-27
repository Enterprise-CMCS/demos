// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
  User as PrismaUser,
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { ContextUser, GraphQLContext } from "../../auth";
import { Loaders } from "../../loaders";
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
  selectDeliverableOrThrow,
  getDeliverable,
  getManyDeliverables,
} from ".";

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
  const mockLoaders = {
    demonstrationById: { load: vi.fn() },
    userById: { load: vi.fn() },
    stateById: { load: vi.fn() },
    deliverablesByDemonstrationId: { load: vi.fn() },
    deliverablesByCmsOwnerId: { load: vi.fn() },
    deliverableDemonstrationTypesByDeliverableId: { load: vi.fn() },
    cmsDocumentsByDeliverableId: { load: vi.fn() },
    stateDocumentsByDeliverableId: { load: vi.fn() },
    documentTypesByDeliverableTypeId: { load: vi.fn() },
    deliverableActionsByDeliverableId: { load: vi.fn() },
    deliverableExtensionsByDeliverableId: { load: vi.fn() },
    publicCommentsByDeliverableId: { load: vi.fn() },
    privateCommentsByDeliverableId: { load: vi.fn() },
  } as unknown as Loaders;
  const mockContext: GraphQLContext = {
    user: mockUser,
    loaders: mockLoaders,
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
    it("delegates to the cmsDocumentsByDeliverableId loader", async () => {
      const documents = [{ id: "doc1" }] as PrismaDocument[];
      vi.mocked(mockLoaders.cmsDocumentsByDeliverableId.load).mockResolvedValue(documents);
      const result = await deliverableResolvers.Deliverable.cmsDocuments(
        { id: testDeliverableId } as PrismaDeliverable,
        undefined,
        mockContext
      );
      expect(mockLoaders.cmsDocumentsByDeliverableId.load).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId
      );
      expect(result).toBe(documents);
    });
  });

  describe("Deliverable.stateDocuments", () => {
    it("delegates to the stateDocumentsByDeliverableId loader", async () => {
      const documents = [{ id: "doc1" }] as PrismaDocument[];
      vi.mocked(mockLoaders.stateDocumentsByDeliverableId.load).mockResolvedValue(documents);
      const result = await deliverableResolvers.Deliverable.stateDocuments(
        { id: testDeliverableId } as PrismaDeliverable,
        undefined,
        mockContext
      );
      expect(mockLoaders.stateDocumentsByDeliverableId.load).toHaveBeenCalledExactlyOnceWith(
        testDeliverableId
      );
      expect(result).toBe(documents);
    });
  });

  describe("Deliverable.cmsOwner", () => {
    it("delegates to the userById loader", async () => {
      const mockDeliverable = { cmsOwnerUserId: testUserId } as PrismaDeliverable;
      const mockOwner = { id: testUserId } as PrismaUser;
      vi.mocked(mockLoaders.userById.load).mockResolvedValue(mockOwner);
      const result = await deliverableResolvers.Deliverable.cmsOwner(
        mockDeliverable,
        undefined,
        mockContext
      );
      expect(mockLoaders.userById.load).toHaveBeenCalledExactlyOnceWith(testUserId);
      expect(result).toBe(mockOwner);
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
          mockContext,
          testDocumentInfo as GraphQLResolveInfo
        )
      ).rejects.toThrow("Unsupported parent type: Document");
      expect(mockLoaders.deliverablesByDemonstrationId.load).not.toHaveBeenCalled();
      expect(mockLoaders.deliverablesByCmsOwnerId.load).not.toHaveBeenCalled();
    });

    describe("Parent: Demonstration", () => {
      it("should load deliverables via the deliverablesByDemonstrationId loader", async () => {
        const deliverables = [{ id: testDeliverableId }] as PrismaDeliverable[];
        vi.mocked(mockLoaders.deliverablesByDemonstrationId.load).mockResolvedValue(deliverables);
        const result = await resolveManyDeliverables(
          testDemonstrationParent as PrismaDemonstration,
          {} as unknown,
          mockContext,
          testDemonstrationInfo as GraphQLResolveInfo
        );
        expect(mockLoaders.deliverablesByDemonstrationId.load).toHaveBeenCalledExactlyOnceWith(
          testDemonstrationId
        );
        expect(result).toBe(deliverables);
      });
    });

    describe("Parent: User", () => {
      it("should load deliverables via the deliverablesByCmsOwnerId loader", async () => {
        const deliverables = [{ id: testDeliverableId }] as PrismaDeliverable[];
        vi.mocked(mockLoaders.deliverablesByCmsOwnerId.load).mockResolvedValue(deliverables);
        const result = await resolveManyDeliverables(
          testUserParent as PrismaUser,
          {} as unknown,
          mockContext,
          testUserInfo as GraphQLResolveInfo
        );
        expect(mockLoaders.deliverablesByCmsOwnerId.load).toHaveBeenCalledExactlyOnceWith(
          testUserId
        );
        expect(result).toBe(deliverables);
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

  describe("Deliverable.deliverableType", () => {
    it("should return the deliverable type from a deliverable", () => {
      const result = deliverableResolvers.Deliverable.deliverableType(
        testDeliverable as PrismaDeliverable
      );
      expect(result).toBe(testDeliverableType);
    });
  });

  describe("Deliverable.Status", () => {
    it("should return the deliverable status from a deliverable", () => {
      const result = deliverableResolvers.Deliverable.status(testDeliverable as PrismaDeliverable);
      expect(result).toBe(testDeliverableStatus);
    });
  });

  describe("Deliverable.dueDateType", () => {
    it("should return the deliverable due date type from a deliverable", () => {
      const result = deliverableResolvers.Deliverable.dueDateType(
        testDeliverable as PrismaDeliverable
      );
      expect(result).toBe(testDeliverableDueDateType);
    });
  });

  describe("Deliverable.demonstration", () => {
    it("loads the parent demonstration via the demonstrationById loader", async () => {
      const mockDemonstration = { id: testDemonstrationId } as PrismaDemonstration;
      vi.mocked(mockLoaders.demonstrationById.load).mockResolvedValue(mockDemonstration);
      const result = await deliverableResolvers.Deliverable.demonstration(
        testDeliverable as PrismaDeliverable,
        undefined,
        mockContext
      );
      expect(mockLoaders.demonstrationById.load).toHaveBeenCalledExactlyOnceWith(
        testDemonstrationId
      );
      expect(result).toBe(mockDemonstration);
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
      it("maps the deliverableDemonstrationTypesByDeliverableId loader result", async () => {
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
        vi.mocked(
          mockLoaders.deliverableDemonstrationTypesByDeliverableId.load
        ).mockResolvedValue(mockDeliverableDemonstrationTypeQueryResult);

        const result = await deliverableResolvers.Deliverable.demonstrationTypes(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(
          mockLoaders.deliverableDemonstrationTypesByDeliverableId.load
        ).toHaveBeenCalledExactlyOnceWith(testDeliverableId);
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
      it("delegates to the deliverableActionsByDeliverableId loader", async () => {
        vi.mocked(mockLoaders.deliverableActionsByDeliverableId.load).mockResolvedValue([]);
        const result = await deliverableResolvers.Deliverable.deliverableActions(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(mockLoaders.deliverableActionsByDeliverableId.load).toHaveBeenCalledExactlyOnceWith(
          testDeliverableId
        );
        expect(result).toEqual([]);
      });
    });

    describe("Deliverable.extensionRequests", () => {
      it("delegates to the deliverableExtensionsByDeliverableId loader", async () => {
        const extensions = [{ id: "extension1" }] as PrismaDeliverableExtension[];
        vi.mocked(mockLoaders.deliverableExtensionsByDeliverableId.load).mockResolvedValue(
          extensions
        );
        const result = await deliverableResolvers.Deliverable.extensionRequests(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(
          mockLoaders.deliverableExtensionsByDeliverableId.load
        ).toHaveBeenCalledExactlyOnceWith(testDeliverableId);
        expect(result).toBe(extensions);
      });
    });

    describe("Deliverable.publicComments", () => {
      it("delegates to the publicCommentsByDeliverableId loader", async () => {
        const comments = [{ id: "comment1" }] as PrismaPublicComment[];
        vi.mocked(mockLoaders.publicCommentsByDeliverableId.load).mockResolvedValue(comments);
        const result = await deliverableResolvers.Deliverable.publicComments(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(mockLoaders.publicCommentsByDeliverableId.load).toHaveBeenCalledExactlyOnceWith(
          testDeliverableId
        );
        expect(result).toBe(comments);
      });
    });

    describe("Deliverable.privateComments", () => {
      it("delegates to the privateCommentsByDeliverableId loader", async () => {
        const comments = [{ id: "comment1" }] as PrismaPrivateComment[];
        vi.mocked(mockLoaders.privateCommentsByDeliverableId.load).mockResolvedValue(comments);
        const result = await deliverableResolvers.Deliverable.privateComments(
          testDeliverable as PrismaDeliverable,
          undefined,
          mockContext
        );
        expect(mockLoaders.privateCommentsByDeliverableId.load).toHaveBeenCalledExactlyOnceWith(
          testDeliverableId
        );
        expect(result).toBe(comments);
      });
    });
  });
});
