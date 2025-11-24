import { GraphQLError } from "graphql";

import { Document as PrismaDocument } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { prisma } from "../../prismaClient.js";
import {
  getApplication,
  PrismaApplication,
} from "../application/applicationResolvers.js";
import type {
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
} from "./documentSchema.js";
import { createS3Adapter, S3Adapter } from "./adapters/S3Adapter.js";

const s3Adapter: S3Adapter = createS3Adapter();

async function getDocument(parent: unknown, { id }: { id: string }) {
  return await prisma().document.findUnique({
    where: { id: id },
  });
}

export const documentResolvers = {
  Query: {
    document: getDocument,
    documentExists: async (
      _: unknown,
      { documentId }: { documentId: string },
    ) => {
      const document = await prisma().document.findUnique({
        where: { id: documentId },
      });

      if (document) return true;
      return false;
    },
  },

  Mutation: {
    uploadDocument: async (
      parent: unknown,
      { input }: { input: UploadDocumentInput },
      context: GraphQLContext,
    ): Promise<UploadDocumentResponse> => {
      if (context.user === null) {
        throw new Error(
          "The GraphQL context does not have user information. Are you properly authenticated?",
        );
      }

      const documentPendingUpload = await prisma().documentPendingUpload.create(
        {
          data: {
            name: input.name,
            description: input.description ?? "",
            ownerUserId: context.user.id,
            documentTypeId: input.documentType,
            applicationId: input.applicationId,
            phaseId: input.phaseName,
          },
        },
      );

      const presignedURL = await s3Adapter.getPresignedUploadUrl(
        documentPendingUpload.id,
      );
      return {
        presignedURL,
        documentId: documentPendingUpload.id,
      };
    },

    downloadDocument: async (_: unknown, { id }: { id: string }) => {
      const document = await prisma().document.findUnique({
        where: { id: id },
      });
      if (!document) {
        throw new GraphQLError("Document not found.", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }
      const key = `${document.applicationId}/${document.id}`;
      return await s3Adapter.getPresignedDownloadUrl(key);
    },

    updateDocument: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateDocumentInput },
    ): Promise<PrismaDocument> => {
      checkOptionalNotNullFields(
        ["name", "documentType", "applicationId", "phaseName"],
        input,
      );
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
    },

    deleteDocument: async (_: unknown, { id }: { id: string }) => {
      return await prisma().$transaction(async (tx) => {
        const document = await tx.document.delete({
          where: { id },
        });
        const key = `${document.applicationId}/${document.id}`;
        await s3Adapter.moveDocumentFromCleanToDeleted(key);
        return document;
      });
    },
    deleteDocuments: async (_: unknown, { ids }: { ids: string[] }) => {
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
    },
  },

  Document: {
    owner: async (parent: PrismaDocument) => {
      const user = await prisma().user.findUnique({
        where: { id: parent.ownerUserId },
        include: { person: true },
      });
      return { ...user, ...user?.person };
    },

    documentType: async (parent: PrismaDocument) => {
      return parent.documentTypeId;
    },

    application: async (parent: PrismaDocument): Promise<PrismaApplication> => {
      return await getApplication(parent.applicationId);
    },

    phaseName: async (parent: PrismaDocument) => {
      return parent.phaseId;
    },
  },
};
