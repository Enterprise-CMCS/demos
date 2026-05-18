import { describe, expect, it, vi } from "vitest";
import { documentPendingUploadResolvers } from "./documentPendingUploadResolvers";
import {
  UploadDocumentToApplicationInput,
  UploadDocumentToDeliverableInput,
  UploadDocumentToPhaseInput,
} from "./documentPendingUploadSchema";
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { getS3Adapter } from "../../adapters";
import { selectDeliverable } from "../deliverable";
import { updateAssociatedPhase } from "./updateAssociatedPhase";

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

const mockS3Adapter = {
  uploadDocument: vi.fn(),
};
vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(() => mockS3Adapter),
}));

vi.mock("../../prismaClient", () => ({
  prisma: () => ({
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  }),
}));

vi.mock("./updateAssociatedPhase", () => ({
  updateAssociatedPhase: vi.fn(),
}));

vi.mock("../applicationPhase", () => ({
  startPhase: vi.fn(),
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("../deliverable", () => ({
  selectDeliverable: vi.fn(),
  resolveDeliverable: vi.fn(),
}));

const mockTransaction = {} as any;

describe("documentResolvers", () => {
  const mockContext = {
    user: {
      id: "user-123",
    },
  } as GraphQLContext;

  const testApplicationId = "application-123";

  describe("Mutations", () => {
    describe("DocumentPendingUpload.uploadDocumentToApplication", () => {
      const input: UploadDocumentToApplicationInput = {
        name: "Test Document",
        documentType: "State Application",
        applicationId: testApplicationId,
        description: "Test document description",
      };

      it("should validate optional fields are not null", async () => {
        await documentPendingUploadResolvers.Mutation.uploadDocumentToApplication(
          undefined,
          { input },
          mockContext
        );

        expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(["description"], input);
      });

      it("should call s3Adapter.uploadDocument with correct parameters", async () => {
        await documentPendingUploadResolvers.Mutation.uploadDocumentToApplication(
          undefined,
          { input },
          mockContext
        );

        expect(getS3Adapter).toHaveBeenCalledOnce();
        expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith({
          name: input.name,
          description: input.description,
          applicationId: input.applicationId,
          ownerUserId: mockContext.user.id,
          documentTypeId: input.documentType,
        });
      });
    });
    describe("DocumentPendingUpload.UploadDocumentToPhase", () => {
      const input: UploadDocumentToPhaseInput = {
        name: "Test Document",
        documentType: "State Application",
        applicationId: testApplicationId,
        description: "Test document description",
        phaseName: "Concept",
      };

      it("should validate optional fields are not null", async () => {
        await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
          undefined,
          { input },
          mockContext
        );

        expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(["description"], input);
      });

      it("should call updateAssociatedPhase with correct parameters", async () => {
        await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
          undefined,
          { input },
          mockContext
        );

        expect(updateAssociatedPhase).toHaveBeenCalledExactlyOnceWith(
          mockTransaction,
          input.applicationId,
          input.phaseName
        );
      });

      it("should call s3Adapter.uploadDocument with correct parameters", async () => {
        await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
          undefined,
          { input },
          mockContext
        );

        expect(getS3Adapter).toHaveBeenCalledOnce();
        expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith(
          {
            name: input.name,
            description: input.description,
            applicationId: input.applicationId,
            documentTypeId: input.documentType,
            ownerUserId: mockContext.user.id,
            phaseId: input.phaseName,
          },
          mockTransaction
        );
      });
    });
    describe("DocumentPendingUpload.uploadDocumentToDeliverable", () => {
      const input: UploadDocumentToDeliverableInput = {
        name: "Test Document",
        documentType: "State Application",
        applicationId: testApplicationId,
        description: "Test document description",
        deliverableId: "deliverable-123",
        isCmsAttachedFile: true,
      };

      it("should validate optional fields are not null", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: input.deliverableId,
          deliverableTypeId: "Close Out Report",
        };
        vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        await documentPendingUploadResolvers.Mutation.uploadDocumentToDeliverable(
          undefined,
          { input },
          mockContext
        );

        expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(["description"], input);
      });

      it("should fetch the corresponding deliverable", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: input.deliverableId,
          deliverableTypeId: "Close Out Report",
        };
        vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        await documentPendingUploadResolvers.Mutation.uploadDocumentToDeliverable(
          undefined,
          { input },
          mockContext
        );

        expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith({ id: input.deliverableId });
      });

      it("should call s3Adapter.uploadDocument with correct parameters", async () => {
        const mockDeliverable: Partial<PrismaDeliverable> = {
          id: input.deliverableId,
          deliverableTypeId: "Close Out Report",
        };
        vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

        await documentPendingUploadResolvers.Mutation.uploadDocumentToDeliverable(
          undefined,
          { input },
          mockContext
        );

        expect(getS3Adapter).toHaveBeenCalledOnce();
        expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith({
          name: input.name,
          description: input.description,
          applicationId: input.applicationId,
          documentTypeId: input.documentType,
          ownerUserId: mockContext.user.id,
          deliverableId: input.deliverableId,
          deliverableIsCmsAttachedFile: input.isCmsAttachedFile,
          deliverableTypeId: mockDeliverable.deliverableTypeId,
        });
      });
    });
  });
});
