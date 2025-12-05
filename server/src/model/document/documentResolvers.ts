import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import type {
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
} from "./documentSchema.js";
import { getS3Adapter } from "../../adapters/s3/S3Adapter.js";
import { DocumentType, PhaseName } from "../../types.js";
import { getDocumentById } from "./queries/getDocumentById.js";
import { getDocumentExists } from "./queries/getDocumentExists.js";
import { updateDocumentMeta } from "./queries/updateDocumentMeta.js";
import { findUserById } from "../user/queries/findUserById.js";
import { handleDeleteDocument } from "./handleDeleteDocument.js";

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
    return getDocumentExists(tx, documentId);
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
      return await s3Adapter.uploadDocument(tx, input, userId);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function downloadDocument(_: unknown, { id }: { id: string }): Promise<string> {
  const s3Adapter = getS3Adapter();
  try {
    return prisma().$transaction(async (tx) => {
      const document = await getDocumentById(tx, id);
      return await s3Adapter.getPresignedDownloadUrl(document.id);
    });
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
      return await updateDocumentMeta(tx, id, input);
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
    downloadDocument: downloadDocument,
    updateDocument: updateDocument,
    deleteDocument: deleteDocument,
    deleteDocuments: deleteDocuments,
  },

  Document: {
    owner: resolveOwner,
    documentType: resolveDocumentType,
    application: resolveApplication,
    phaseName: resolvePhaseName,
  },
};
