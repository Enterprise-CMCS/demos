import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import type {
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
  ApplicationDateInput,
  DocumentType,
  PhaseName,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getEasternNow } from "../../dateUtilities";
import { getApplication, PrismaApplication } from "../application";
import { getUser } from "../user";
import { validateAndUpdateDates } from "../applicationDate";
import { startPhaseByDocument } from "../applicationPhase";
import { enqueueUiPath } from "../../services/uipathQueue";
import { resolveDeliverable } from "../deliverable";
import { updateDocument as updateDocumentQuery, handleDeleteDocument } from ".";
import { getDocument } from "./documentData";

export async function uploadDocument(
  parent: unknown,
  { input }: { input: UploadDocumentInput },
  context: GraphQLContext
): Promise<UploadDocumentResponse> {
  checkOptionalNotNullFields(
    ["name", "documentType", "applicationId", "phaseName", "deliverableId"],
    input
  );

  const s3Adapter = getS3Adapter();

  try {
    if (context.user === null) {
      throw new Error(
        "The GraphQL context does not have user information. Are you properly authenticated?"
      );
    }

    if (input.phaseName && input.deliverableId) {
      throw new Error("A document cannot be associated with both a phase and a deliverable.");
    }

    const userId = context.user.id;
    return await prisma().$transaction(async (tx) => {
      const easternNow = getEasternNow();
      const phaseStartDate = await startPhaseByDocument(tx, input.applicationId, input, easternNow);

      const datesToUpdate: ApplicationDateInput[] = [];

      if (phaseStartDate) {
        datesToUpdate.push(phaseStartDate);
      }

      if (datesToUpdate.length > 0) {
        await validateAndUpdateDates(
          { applicationId: input.applicationId, applicationDates: datesToUpdate },
          tx
        );
      }

      return await s3Adapter.uploadDocument(tx, input, userId);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateDocument(
  _: unknown,
  { id, input }: { id: string; input: UpdateDocumentInput }
): Promise<PrismaDocument> {
  checkOptionalNotNullFields(
    ["name", "documentType", "applicationId", "phaseName", "deliverableId"],
    input
  );
  try {
    return await prisma().$transaction(async (tx) => {
      return await updateDocumentQuery(tx, id, input);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocument(_: unknown, { id }: { id: string }): Promise<PrismaDocument> {
  const s3Adapter = getS3Adapter();

  try {
    return prisma().$transaction(async (tx) => {
      return handleDeleteDocument(tx, s3Adapter, id);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocuments(_: unknown, { ids }: { ids: string[] }): Promise<number> {
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

/**
 * This will fail if doc does not exist or docId is null or empty
 * @param _ refetch
 * @param documentId the document to run through UiPath
 * @returns MessageId
 */
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

export async function resolveOwner(parent: PrismaDocument): Promise<PrismaUser> {
  try {
    return prisma().$transaction(async (tx) => {
      return getUser({ id: parent.ownerUserId }, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolveApplication(parent: PrismaDocument): Promise<PrismaApplication> {
  return await getApplication(parent.applicationId);
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

export const documentResolvers = {
  Query: {
    document: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      getDocument({ id: args.id }, context.user),
    documentExists: async (
      parent: unknown,
      args: { documentId: string },
      context: GraphQLContext
    ) => !!(await getDocument({ id: args.documentId }, context.user)),
  },

  Mutation: {
    uploadDocument: uploadDocument,
    updateDocument: updateDocument,
    deleteDocument: deleteDocument,
    deleteDocuments: deleteDocuments,
    triggerUiPath: triggerUiPath,
  },

  Document: {
    owner: resolveOwner,
    documentType: (parent: PrismaDocument) => parent.documentTypeId as DocumentType,
    presignedDownloadUrl: async (parent: PrismaDocument) =>
      await getS3Adapter().getPresignedDownloadUrl(parent.s3Path),
    application: resolveApplication,
    deliverable: resolveDeliverable,
    phaseName: (parent: PrismaDocument) => parent.phaseId as PhaseName,
    hasPendingUIPathResult: resolveHasPendingUIPathResult,
  },
};
