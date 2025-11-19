import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
} from "@prisma/client";
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
import { log } from "../../log.js";

const LOCAL_SIMPLE_UPLOAD_ENDPOINT = "http://localhost:4566";

const resolveS3Endpoint = (): string | undefined => {
  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    return LOCAL_SIMPLE_UPLOAD_ENDPOINT;
  }
  return process.env.S3_ENDPOINT_LOCAL;
};

const createS3Client = () => {
  const endpoint = resolveS3Endpoint();
  const s3ClientConfig = endpoint
    ? {
        region: "us-east-1",
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : {};

  return new S3Client(s3ClientConfig);
};

async function getDocument(parent: unknown, { id }: { id: string }) {
  return await prisma().document.findUnique({
    where: { id: id },
  });
}

async function getPresignedUploadUrl(
  documentPendingUpload: PrismaDocumentPendingUpload
): Promise<string> {
  const s3 = createS3Client();
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

async function getPresignedDownloadUrl(document: PrismaDocument): Promise<string> {
  const s3 = createS3Client();
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
      context: GraphQLContext
    ): Promise<UploadDocumentResponse> => {
      if (context.user === null) {
        throw new Error(
          "The GraphQL context does not have user information. Are you properly authenticated?"
        );
      }
      // Looks for localstack pre-signed and does a simplified upload flow
      if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
        const documentId = randomUUID();
        const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-simple-upload";
        const s3Path = `s3://${uploadBucket}/${input.applicationId}/${documentId}`;
        const document = await prisma().document.create({
          data: {
            id: documentId,
            name: input.name,
            description: input.description ?? "",
            ownerUserId: context.user.id,
            documentTypeId: input.documentType,
            applicationId: input.applicationId,
            phaseId: input.phaseName,
            s3Path,
          },
        });

        const fakePresignedUrl = await getPresignedUploadUrl(document);
        log.debug("fakePresignedUrl", undefined, fakePresignedUrl);
        return {
          presignedURL: fakePresignedUrl, documentId: document.id,
        };
      }
      const documentPendingUpload = await prisma().documentPendingUpload.create({
          data: {
            name: input.name,
            description: input.description ?? "",
            ownerUserId: context.user.id,
            documentTypeId: input.documentType,
            applicationId: input.applicationId,
            phaseId: input.phaseName,
          },
      });

      const presignedURL = await getPresignedUploadUrl(documentPendingUpload);
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
      return await getPresignedDownloadUrl(document);
    },

    updateDocument: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateDocumentInput }
    ): Promise<PrismaDocument> => {
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
    },

    deleteDocuments: async (_: unknown, { ids }: { ids: string[] }) => {
      const deleteResult = await prisma().document.deleteMany({
        where: { id: { in: ids } },
      });
      return deleteResult.count;
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
