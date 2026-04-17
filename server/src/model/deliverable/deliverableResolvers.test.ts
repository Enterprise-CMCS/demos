// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";
import {
  CreateDeliverableInput,
  DateTimeOrLocalDate,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
} from "../../types";

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
  createDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  getManyDeliverables: vi.fn(),
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

import { createDeliverable, getDeliverable, getManyDeliverables } from ".";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getManyDocuments } from "../document";

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

  const testContext: GraphQLContext = {
    user: {
      id: "testUserId",
    },
  } as GraphQLContext;

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

  beforeEach(() => {
    vi.resetAllMocks();
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

  it("delegates `Deliverable.cmsDocuments` to `documentData.getManyDocuments`", async () => {
    const mockDeliverable = { id: testDeliverableId } as PrismaDeliverable;
    await deliverableResolvers.Deliverable.cmsDocuments(mockDeliverable, undefined, testContext);
    expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
      {
        AND: [{ deliverableId: testDeliverableId }, { deliverableIsCmsAttachedFile: true }],
      },
      testContext.user
    );
  });

  it("delegates `Deliverable.stateDocuments` to `documentData.getManyDocuments`", async () => {
    const mockDeliverable = { id: testDeliverableId } as PrismaDeliverable;
    await deliverableResolvers.Deliverable.stateDocuments(mockDeliverable, undefined, testContext);
    expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
      {
        AND: [{ deliverableId: testDeliverableId }, { deliverableIsCmsAttachedFile: false }],
      },
      testContext.user
    );
  });
  describe("deliverableResolvers", () => {
    describe("Mutation.createDeliverable", () => {
      it("should call the createDeliverable function with the right arguments", async () => {
        const testInput: CreateDeliverableInput = {
          name: "A name!",
          deliverableType: "Close Out Report",
          demonstrationId: testDemonstrationId,
          dueDate: "2025-11-31" as DateTimeOrLocalDate,
          cmsOwnerUserId: testUserId,
        };

        await deliverableResolvers.Mutation.createDeliverable(
          {},
          { input: testInput },
          {} as GraphQLContext
        );
        expect(createDeliverable).toHaveBeenCalledExactlyOnceWith(testInput, {});
      });
    });
  });
});
