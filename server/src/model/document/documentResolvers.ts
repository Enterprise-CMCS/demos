import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import {
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
} from "../../types.js";
import { getUser } from "../user/userResolvers.js";
import { createDocumentAdapter, DocumentAdapter } from "../../adapters/document/DocumentAdapter.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { GraphQLContext } from "../../auth/auth.util.js";

async function resolveOwner(parent: PrismaDocument): Promise<PrismaUser> {
  return getUser(parent.ownerUserId);
}

function resolveDocumentType(parent: PrismaDocument): DocumentType {
  // casting enforced by database; documentTypeId must be a valid DocumentType
  return parent.documentTypeId as DocumentType;
}

async function resolveApplication(parent: PrismaDocument): Promise<PrismaApplication> {
  return await getApplication(parent.applicationId);
}

function resolvePhaseName(parent: PrismaDocument): PhaseName {
  // casting enforced by database; phaseId must be a valid PhaseName
  return parent.phaseId as PhaseName;
}

export async function documentExists(
  parent: unknown,
  { documentId }: { documentId: string }
): Promise<boolean> {
  const document = await prisma().document.findUnique({
    where: { id: documentId },
  });

  if (document) return true;
  return false;
}

export async function downloadDocument(parent: unknown, { id }: { id: string }): Promise<string> {
  const s3Adapter: DocumentAdapter = createDocumentAdapter();

  try {
    const document = await prisma().document.findUniqueOrThrow({
      where: { id: id },
    });
    return await s3Adapter.getPresignedDownloadUrl(document.id);
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function uploadDocument(
  parent: unknown,
  { input }: { input: UploadDocumentInput },
  context: GraphQLContext
): Promise<UploadDocumentResponse> {
  const documentAdapter: DocumentAdapter = createDocumentAdapter();

  if (!context.user) {
    throw new Error(
      "The GraphQL context does not have user information. Are you properly authenticated?"
    );
  }
  return documentAdapter.uploadDocument({ input }, context.user.id);
}

export async function updateDocument(
  parent: unknown,
  { id, input }: { id: string; input: UpdateDocumentInput }
): Promise<PrismaDocument> {
  checkOptionalNotNullFields(["name", "documentType", "applicationId", "phaseName"], input);
  try {
    return await prisma().document.update({
      where: { id: id },
      data: {
        name: input.name,
        description: input.description,
        documentTypeId: input.documentType,
        applicationId: input.applicationId,
        phaseId: input.phaseName,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function getDocument(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDocument> {
  try {
    return await prisma().document.findUniqueOrThrow({
      where: { id: id },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocuments(
  parent: unknown,
  { ids }: { ids: string[] }
): Promise<number> {
  const s3Adapter: DocumentAdapter = createDocumentAdapter();

  return await prisma().$transaction(async (tx) => {
    const documents = await tx.document.findMany({
      where: { id: { in: ids } },
    });

    for (const document of documents) {
      const key = `${document.applicationId}/${document.id}`;
      await s3Adapter.moveDocumentFromCleanToDeleted(key);
    }

    const result = await tx.document.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  });
}

export async function deleteDocument(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDocument> {
  const s3Adapter: DocumentAdapter = createDocumentAdapter();

  try {
    return await prisma().$transaction(async (tx) => {
      const document = await tx.document.delete({
        where: { id },
      });
      const key = `${document.applicationId}/${document.id}`;
      await s3Adapter.moveDocumentFromCleanToDeleted(key);
      return document;
    });
  } catch (error) {
    handlePrismaError(error);
  }
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
