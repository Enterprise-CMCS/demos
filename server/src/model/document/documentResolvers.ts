import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import type {
  BudgetNeutralityValidationStatus,
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getApplication, PrismaApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { enqueueUiPath } from "../../services/uipathQueue";
import { resolveDeliverable } from "../deliverable";
import { updateDocument as updateDocumentQuery, handleDeleteDocument } from ".";
import { getDocument } from "./documentData";
import type {
  BudgetNeutralityValidationError,
  BudgetNeutralityValidationResult,
} from "./documentSchema";

export async function updateDocument(
  parent: unknown,
  { id, input }: { id: string; input: UpdateDocumentInput }
): Promise<PrismaDocument> {
  checkOptionalNotNullFields(["name", "description", "documentType"], input);
  try {
    return await prisma().$transaction(async (tx) => {
      return await updateDocumentQuery(tx, id, input);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocument(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDocument> {
  const s3Adapter = getS3Adapter();

  try {
    return prisma().$transaction(async (tx) => {
      return handleDeleteDocument(tx, s3Adapter, id);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocuments(
  parent: unknown,
  { ids }: { ids: string[] }
): Promise<number> {
  const s3Adapter = getS3Adapter();

  try {
    return prisma().$transaction(async (tx) => {
      let count = 0;
      for (const documentId of ids) {
        await handleDeleteDocument(tx, s3Adapter, documentId);
        count++;
      }
      return count;
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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
    updateDocument: updateDocument,
    deleteDocument: deleteDocument,
    deleteDocuments: deleteDocuments,
    triggerUiPath: triggerUiPath,
  },

  Document: {
    owner: (parent: PrismaDocument): Promise<PrismaUser> =>
      selectUserOrThrow({ id: parent.ownerUserId }),
    documentType: (parent: PrismaDocument): DocumentType => parent.documentTypeId as DocumentType,
    presignedDownloadUrl: (parent: PrismaDocument): Promise<string> =>
      getS3Adapter().getPresignedDownloadUrl(parent.s3Path),
    application: (parent: PrismaDocument): Promise<PrismaApplication> =>
      getApplication(parent.applicationId),
    deliverable: resolveDeliverable,
    isPartOfDeliverableSubmission: (parent: PrismaDocument): boolean =>
      !!parent.deliverableSubmissionActionId,
    phaseName: (parent: PrismaDocument): PhaseName => parent.phaseId as PhaseName,
    hasPendingUIPathResult: resolveHasPendingUIPathResult,
    budgetNeutralityValidation: resolveBudgetNeutralityValidation,
  },
};
