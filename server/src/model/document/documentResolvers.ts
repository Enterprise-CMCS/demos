import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import { log } from "../../log";
import type {
  BudgetNeutralityValidationStatus,
  DeliverableAction,
  DeliverableActionType,
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getApplication, PrismaApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { enqueueUiPath } from "../../services/uipathQueue";
import { resolveDeliverable } from "../deliverable";
import { editDocument, getDocument, removeDocument } from "./documentData";
import type {
  BudgetNeutralityValidationError,
  BudgetNeutralityValidationResult,
} from "./documentSchema";
import { selectDeliverableAction } from "../deliverableAction/queries";
import { formatDetailsMessage, formatFullUserName } from "../deliverableAction";

export async function triggerUiPath(
  parent: unknown,
  args: { documentId: string },
  context: GraphQLContext
): Promise<string> {
  try {
    const exists = !!(await getDocument({ id: args.documentId }, context.user));
    if (!exists) {
      throw new Error(`Document with ID ${args.documentId} does not exist.`);
    }

    return await enqueueUiPath({
      documentId: args.documentId,
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolveHasPendingUIPathResult(parent: PrismaDocument): Promise<boolean> {
  try {
    const pendingUiPathResults = await prisma().uiPathResult.findFirst({
      where: {
        documentId: parent.id,
        applicationId: parent.applicationId,
        statusId: "Pending",
      },
      select: { id: true },
    });
    return pendingUiPathResults !== null;
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolveBudgetNeutralityValidation(
  parent: PrismaDocument
): Promise<BudgetNeutralityValidationResult | null> {
  try {
    const row = await prisma().budgetNeutralityWorkbook.findUnique({
      where: { id: parent.id },
      select: { validationStatusId: true, validationData: true },
    });
    if (!row) return null;
    return {
      status: row.validationStatusId as BudgetNeutralityValidationStatus,
      errors: (row.validationData as unknown as BudgetNeutralityValidationError[]) ?? [],
    };
  } catch (error) {
    handlePrismaError(error);
  }
}

export const documentResolvers = {
  Query: {
    document: (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDocument> => getDocument({ id: args.id }, context.user),
    documentExists: async (
      parent: unknown,
      args: { documentId: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      try {
        return !!(await getDocument({ id: args.documentId }, context.user));
      } catch {
        return false;
      }
    },
  },

  Mutation: {
    updateDocument: async (
      parent: unknown,
      { id, input }: { id: string; input: UpdateDocumentInput },
      context: GraphQLContext
    ): Promise<PrismaDocument> => {
      checkOptionalNotNullFields(["name", "description"], input);
      try {
        return await editDocument(
          { id },
          {
            name: input.name,
            description: input.description,
          },
          context.user
        );
      } catch (error) {
        handlePrismaError(error);
      }
    },
    updateDeliverableCmsDocument: async (
      parent: unknown,
      { id, input }: { id: string; input: UpdateDocumentInput },
      context: GraphQLContext
    ): Promise<PrismaDocument> => {
      checkOptionalNotNullFields(["name", "description"], input);
      try {
        return await editDocument(
          { id, deliverableId: { not: null }, deliverableIsCmsAttachedFile: true },
          {
            name: input.name,
            description: input.description,
          },
          context.user
        );
      } catch (error) {
        handlePrismaError(error);
      }
    },
    updateDeliverableStateDocument: async (
      parent: unknown,
      { id, input }: { id: string; input: UpdateDocumentInput },
      context: GraphQLContext
    ): Promise<PrismaDocument> => {
      checkOptionalNotNullFields(["name", "description"], input);
      try {
        return await editDocument(
          { id, deliverableId: { not: null }, deliverableIsCmsAttachedFile: false },
          {
            name: input.name,
            description: input.description,
          },
          context.user
        );
      } catch (error) {
        handlePrismaError(error);
      }
    },
    deleteDocuments: (
      parent: unknown,
      { ids }: { ids: string[] },
      context: GraphQLContext
    ): Promise<number> => {
      try {
        return prisma().$transaction(async (tx) => {
          let count = 0;
          for (const documentId of ids) {
            await removeDocument({ id: documentId }, context.user, tx);
            count++;
          }
          return count;
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
    deleteDeliverableCmsDocuments: async (
      parent: unknown,
      { ids }: { ids: string[] },
      context: GraphQLContext
    ): Promise<number> => {
      try {
        return prisma().$transaction(async (tx) => {
          let count = 0;
          for (const documentId of ids) {
            await removeDocument(
              { id: documentId, deliverableId: { not: null }, deliverableIsCmsAttachedFile: true },
              context.user,
              tx
            );
            count++;
          }
          return count;
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
    deleteDeliverableStateDocuments: async (
      parent: unknown,
      { ids }: { ids: string[] },
      context: GraphQLContext
    ): Promise<number> => {
      try {
        return prisma().$transaction(async (tx) => {
          let count = 0;
          for (const documentId of ids) {
            await removeDocument(
              { id: documentId, deliverableId: { not: null }, deliverableIsCmsAttachedFile: false },
              context.user,
              tx
            );
            count++;
          }
          return count;
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
    triggerUiPath: triggerUiPath,
  },

  Document: {
    owner: (parent: PrismaDocument): Promise<PrismaUser> =>
      selectUserOrThrow({ id: parent.ownerUserId }),
    documentType: (parent: PrismaDocument): DocumentType => parent.documentTypeId as DocumentType,
    presignedDownloadUrl: (
      parent: PrismaDocument,
      args: unknown,
      context: GraphQLContext
    ): Promise<string> => {
      log.info(
        {
          userId: context.user.id,
          documentId: parent.id,
          documentName: parent.name,
          applicationId: parent.applicationId,
          s3Path: parent.s3Path,
          type: "document.download.presigned",
        },
        "Presigned download URL generated for document"
      );
      return getS3Adapter().getPresignedDownloadUrl(parent.s3Path, parent.name);
    },
    downloadFileName: (parent: PrismaDocument): Promise<string> =>
      getS3Adapter().getDownloadFileName(parent.s3Path, parent.name),
    application: (parent: PrismaDocument): Promise<PrismaApplication> =>
      getApplication(parent.applicationId),
    deliverable: resolveDeliverable,
    deliverableSubmissionAction: async (
      parent: PrismaDocument
    ): Promise<DeliverableAction | null> => {
      if (!parent.deliverableSubmissionActionId) {
        return null;
      }
      const deliverableAction = await selectDeliverableAction(
        {
          id: parent.deliverableSubmissionActionId,
        },
        true
      );
      return {
        id: deliverableAction.id,
        actionTimestamp: deliverableAction.actionTimestamp,
        actionType: deliverableAction.actionTypeId as DeliverableActionType,
        details: formatDetailsMessage(deliverableAction),
        userFullName: formatFullUserName(deliverableAction),
      };
    },
    phaseName: (parent: PrismaDocument): PhaseName => parent.phaseId as PhaseName,
    hasPendingUIPathResult: resolveHasPendingUIPathResult,
    budgetNeutralityValidation: resolveBudgetNeutralityValidation,
  },
};
