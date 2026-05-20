import { DocumentPendingUpload as PrismaDocumentPendingUpload } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import type {
  DocumentType,
  PhaseName,
  UploadDocumentToApplicationInput,
  UploadDocumentToPhaseInput,
  UploadDocumentToDeliverableInput,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getApplication, PrismaApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { selectDeliverableOrThrow, resolveDeliverable } from "../deliverable";
import { updateAssociatedPhase } from "./updateAssociatedPhase";
import { handleUploadDocumentToDeliverable } from "./handleUploadDocumentToDeliverable";

export async function resolveApplication(
  parent: PrismaDocumentPendingUpload
): Promise<PrismaApplication> {
  return await getApplication(parent.applicationId);
}

export const documentPendingUploadResolvers = {
  Mutation: {
    uploadDocumentToApplication: async (
      parent: unknown,
      { input }: { input: UploadDocumentToApplicationInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> => {
      checkOptionalNotNullFields(["description"], input);
      try {
        return await getS3Adapter().uploadDocument({
          name: input.name,
          description: input.description,
          applicationId: input.applicationId,
          ownerUserId: context.user.id,
          documentTypeId: input.documentType,
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
    uploadDocumentToPhase: async (
      parent: unknown,
      { input }: { input: UploadDocumentToPhaseInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> => {
      checkOptionalNotNullFields(["description"], input);

      try {
        return await prisma().$transaction(async (tx) => {
          await updateAssociatedPhase(tx, input.applicationId, input.phaseName);
          return await getS3Adapter().uploadDocument(
            {
              name: input.name,
              description: input.description,
              applicationId: input.applicationId,
              ownerUserId: context.user.id,
              documentTypeId: input.documentType,
              phaseId: input.phaseName,
            },
            tx
          );
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
    uploadDocumentToDeliverableCMSFiles: async (
      parent: unknown,
      { input }: { input: UploadDocumentToDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> =>
      handleUploadDocumentToDeliverable(input, context.user.id, true),
    uploadDocumentToDeliverableStateFiles: async (
      parent: unknown,
      { input }: { input: UploadDocumentToDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> =>
      handleUploadDocumentToDeliverable(input, context.user.id, false),
  },

  DocumentPendingUpload: {
    owner: (parent: PrismaDocumentPendingUpload) =>
      selectUserOrThrow({ id: parent.ownerUserId }),
    documentType: (parent: PrismaDocumentPendingUpload) => parent.documentTypeId as DocumentType,
    presignedUploadUrl: async (parent: PrismaDocumentPendingUpload) =>
      await getS3Adapter().getPresignedUploadUrl(parent.id),
    application: resolveApplication,
    deliverable: resolveDeliverable,
    phaseName: (parent: PrismaDocumentPendingUpload) => parent.phaseId as PhaseName,
  },
};
