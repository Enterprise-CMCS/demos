import {
  DocumentPendingUpload as PrismaDocumentPendingUpload,
  User as PrismaUser,
} from "@prisma/client";
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
import { resolveDeliverable } from "../deliverable";
import { updateAssociatedPhase } from "./updateAssociatedPhase";
import { handleUploadDocumentToDeliverable } from "./handleUploadDocumentToDeliverable";
import { validateStateUserCanUploadStateDocumentToDeliverable } from "./validateStateUserCanUploadStateDocumentToDeliverable";

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
    uploadDocumentToDeliverableCMSFiles: (
      parent: unknown,
      { input }: { input: UploadDocumentToDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> =>
      handleUploadDocumentToDeliverable(input, context.user.id, true),
    uploadDocumentToDeliverableStateFiles: (
      parent: unknown,
      { input }: { input: UploadDocumentToDeliverableInput },
      context: GraphQLContext
    ): Promise<PrismaDocumentPendingUpload> => {
      if (context.user.personTypeId === "demos-state-user") {
        validateStateUserCanUploadStateDocumentToDeliverable(context.user.id, input.applicationId);
      }
      return handleUploadDocumentToDeliverable(input, context.user.id, false);
    },
  },

  DocumentPendingUpload: {
    owner: (parent: PrismaDocumentPendingUpload): Promise<PrismaUser> =>
      selectUserOrThrow({ id: parent.ownerUserId }),
    documentType: (parent: PrismaDocumentPendingUpload): DocumentType =>
      parent.documentTypeId as DocumentType,
    presignedUploadUrl: (parent: PrismaDocumentPendingUpload): Promise<string> =>
      getS3Adapter().getPresignedUploadUrl(parent.id),
    application: (parent: PrismaDocumentPendingUpload): Promise<PrismaApplication> =>
      getApplication(parent.applicationId),
    deliverable: resolveDeliverable,
    phaseName: (parent: PrismaDocumentPendingUpload): PhaseName => parent.phaseId as PhaseName,
  },
};
