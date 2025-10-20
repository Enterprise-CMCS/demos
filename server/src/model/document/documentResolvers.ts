import { GraphQLError } from "graphql";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Document, DocumentPendingUpload } from "@prisma/client";

import { GraphQLContext } from "../../auth/auth.util.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { prisma } from "../../prismaClient.js";
import { getApplication } from "../application/applicationResolvers.js";
import { UpdateDocumentInput, UploadDocumentInput } from "./documentSchema.js";

async function getDocument(parent: undefined, { id }: { id: string }) {
  return await prisma().document.findUnique({
    where: { id: id },
  });
}

async function getPresignedUploadUrl(
  documentPendingUpload: DocumentPendingUpload
): Promise<string> {
  const s3ClientConfig = process.env.S3_ENDPOINT_LOCAL
    ? {
        region: "us-east-1",
        endpoint: process.env.S3_ENDPOINT_LOCAL,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : {};
  const s3 = new S3Client(s3ClientConfig);
  const uploadBucket = process.env.UPLOAD_BUCKET;
  const key = documentPendingUpload.id;
  const command = new PutObjectCommand({
    Bucket: uploadBucket,
    Key: key,
  });
  return await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });
}

async function getPresignedDownloadUrl(document: Document): Promise<string> {
  const s3ClientConfig = process.env.S3_ENDPOINT_LOCAL
    ? {
        region: "us-east-1",
        endpoint: process.env.S3_ENDPOINT_LOCAL,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : {};
  const s3 = new S3Client(s3ClientConfig);
  const cleanBucket = process.env.CLEAN_BUCKET;
  const key = `${document.applicationId}/${document.id}`;
  const getObjectCommand = new GetObjectCommand({
    Bucket: cleanBucket,
    Key: key,
  });
  const s3Url = await getSignedUrl(s3, getObjectCommand, {
    expiresIn: 3600,
  });
  return s3Url;
}

export const documentResolvers = {
  Query: {
    document: getDocument,
  },

  Mutation: {
    uploadDocument: async (
      parent: undefined,
      { input }: { input: UploadDocumentInput },
      context: GraphQLContext
    ) => {
      if (context.user === null) {
        throw new Error(
          "The GraphQL context does not have user information. Are you properly authenticated?"
        );
      }
      const documentPendingUpload = await prisma().documentPendingUpload.create({
        data: {
          name: input.name,
          description: input.description,
          ownerUserId: context.user.id,
          documentTypeId: input.documentType,
          applicationId: input.applicationId,
          phaseId: input.phaseName,
        },
      });

      const presignedURL = await getPresignedUploadUrl(documentPendingUpload);
      return { presignedURL };
    },

    downloadDocument: async (_: undefined, { id }: { id: string }) => {
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
      return await getPresignedDownloadUrl(document);
    },

    updateDocument: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDocumentInput }
    ): Promise<Document> => {
      checkOptionalNotNullFields(
        ["name", "description", "documentType", "applicationId", "phaseName"],
        input
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

    deleteDocuments: async (_: undefined, { ids }: { ids: string[] }) => {
      const deleteResult = await prisma().document.deleteMany({
        where: { id: { in: ids } },
      });
      return deleteResult.count;
    },
  },

  Document: {
    owner: async (parent: Document) => {
      const user = await prisma().user.findUnique({
        where: { id: parent.ownerUserId },
        include: { person: true },
      });
      return { ...user, ...user?.person };
    },

    documentType: async (parent: Document) => {
      return parent.documentTypeId;
    },

    application: async (parent: Document) => {
      return await getApplication(parent.applicationId);
    },

    phaseName: async (parent: Document) => {
      return parent.phaseId;
    },
  },
};
