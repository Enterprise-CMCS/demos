import {
  Amendment,
  ApplicationPhase,
  Demonstration,
  Extension,
  Prisma,
  Document as PrismaDocument,
  User as PrismaUser,
  User,
} from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import type {
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
  ApplicationDateInput,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getEasternNow } from "../../dateUtilities";
import { getApplication, PrismaApplication } from "../application";
import { findUserById } from "../user";
import { validateAndUpdateDates } from "../applicationDate";
import { startPhaseByDocument } from "../applicationPhase";
import { enqueueUiPath } from "../../services/uipathQueue";
import {
  checkDocumentExists,
  getDocumentById,
  updateDocument as updateDocumentQuery,
  handleDeleteDocument,
} from ".";
import { GraphQLResolveInfo } from "graphql";

export async function getDocuments(
  parent: Amendment | ApplicationPhase | Demonstration | Extension | User,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDocument[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.DocumentWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Amendment:
      filter = { applicationId: (parent as Extract<typeof parent, Amendment>).id };
      break;
    case Prisma.ModelName.ApplicationPhase:
      filter = {
        applicationId: (parent as Extract<typeof parent, ApplicationPhase>).applicationId,
        phaseId: (parent as ApplicationPhase).phaseId,
      };
      break;
    case Prisma.ModelName.Demonstration:
      filter = { applicationId: (parent as Extract<typeof parent, Demonstration>).id };
      break;
    case Prisma.ModelName.Extension:
      filter = { applicationId: (parent as Extract<typeof parent, Extension>).id };
      break;
    case Prisma.ModelName.User:
      filter = { ownerUserId: (parent as Extract<typeof parent, User>).id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().document.findMany({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function getDocument(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDocument> {
  return await prisma().$transaction(async (tx) => {
    return await getDocumentById(tx, id);
  });
}

export async function documentExists(_: unknown, { documentId }: { documentId: string }) {
  return await prisma().$transaction(async (tx) => {
    return checkDocumentExists(tx, documentId);
  });
}

export async function uploadDocument(
  parent: unknown,
  { input }: { input: UploadDocumentInput },
  context: GraphQLContext
): Promise<UploadDocumentResponse> {
  const s3Adapter = getS3Adapter();

  try {
    if (context.user === null) {
      throw new Error(
        "The GraphQL context does not have user information. Are you properly authenticated?"
      );
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

export async function resolvePresignedDownloadUrl(parent: Pick<PrismaDocument, "s3Path">) {
  const s3Adapter = getS3Adapter();
  try {
    return await s3Adapter.getPresignedDownloadUrl(parent.s3Path);
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateDocument(
  _: unknown,
  { id, input }: { id: string; input: UpdateDocumentInput }
): Promise<PrismaDocument> {
  checkOptionalNotNullFields(["name", "documentType", "applicationId", "phaseName"], input);
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
  _: unknown,
  { documentId }: { documentId: string }
): Promise<string> {
  try {
    const exists = await prisma().$transaction(async (tx) => {
      return checkDocumentExists(tx, documentId);
    });

    if (!exists) {
      throw new Error(`Document with ID ${documentId} does not exist.`);
    }
    return await enqueueUiPath({
      documentId,
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolveOwner(parent: PrismaDocument): Promise<PrismaUser> {
  try {
    return prisma().$transaction(async (tx) => {
      return findUserById(tx, parent.ownerUserId);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export function resolveDocumentType(parent: PrismaDocument): DocumentType {
  return parent.documentTypeId as DocumentType;
}

export async function resolveApplication(parent: PrismaDocument): Promise<PrismaApplication> {
  return await getApplication(parent.applicationId);
}

export function resolvePhaseName(parent: PrismaDocument): PhaseName {
  return parent.phaseId as PhaseName;
}

export const documentResolvers = {
  Query: {
    document: getDocument,
    documentExists: documentExists,
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
    documentType: resolveDocumentType,
    presignedDownloadUrl: resolvePresignedDownloadUrl,
    application: resolveApplication,
    phaseName: resolvePhaseName,
  },
};
