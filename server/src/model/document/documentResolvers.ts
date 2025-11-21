import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
} from "@prisma/client";
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

export const uploadDocument = async (
  parent: unknown,
  { input }: { input: UploadDocumentInput },
  context: GraphQLContext,
): Promise<UploadDocumentResponse> => {
  if (context.user === null) {
    throw new Error(
      "The GraphQL context does not have user information. Are you properly authenticated?",
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
      presignedURL: fakePresignedUrl,
      documentId: document.id,
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
};

async function getDocument(parent: unknown, { id }: { id: string }) {
  return await prisma().document.findUnique({
    where: { id: id },
  });
}

async function getPresignedUploadUrl(
  documentPendingUpload: PrismaDocumentPendingUpload,
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

async function getPresignedDownloadUrl(
  document: PrismaDocument,
): Promise<string> {
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

async function moveDocumentFromCleanToDeletedBuckets(document: PrismaDocument) {
  // temporary bypass for backward compatability with simple upload.
  // TODO: remove this bypass
  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    return;
  }

  const s3 = createS3Client();

  try {
    const copyResponse = await s3.send(
      new CopyObjectCommand({
        CopySource: `${process.env.CLEAN_BUCKET}/${document.applicationId}/${document.id}`,
        Bucket: process.env.DELETED_BUCKET,
        Key: `${document.applicationId}/${document.id}`,
      }),
    );
    if (
      !copyResponse.$metadata.httpStatusCode ||
      copyResponse.$metadata.httpStatusCode !== 200
    ) {
      throw new Error(
        `Response from copy operation returned with a non-200 status: ${copyResponse.$metadata.httpStatusCode}`,
      );
    }
  } catch (error) {
    throw new Error(`Error while copying document to deleted bucket: ${error}`);
  }

  try {
    const deleteResponse = await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLEAN_BUCKET,
        Key: `${document.applicationId}/${document.id}`,
      }),
    );
    if (
      !deleteResponse.$metadata.httpStatusCode ||
      (deleteResponse.$metadata.httpStatusCode !== 200 &&
        deleteResponse.$metadata.httpStatusCode !== 204)
    ) {
      throw new Error(
        `Response from delete operation returned with a non-200 status: ${deleteResponse.$metadata.httpStatusCode}`,
      );
    }
  } catch (error) {
    throw new Error(`Failed to delete document from clean bucket: ${error}`);
  }
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
    uploadDocument: uploadDocument,
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
        await moveDocumentFromCleanToDeletedBuckets(document);
        return document;
      });
    },
    deleteDocuments: async (_: unknown, { ids }: { ids: string[] }) => {
      return await prisma().$transaction(async (tx) => {
        const documents = await tx.document.findMany({
          where: { id: { in: ids } },
        });

        for (const document of documents) {
          await moveDocumentFromCleanToDeletedBuckets(document);
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
