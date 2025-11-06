import { randomUUID } from "crypto";
import { GraphQLError } from "graphql";
import { log } from "../../log.js";
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
import {
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
} from "./documentSchema.js";

async function getDocument(parent: unknown, { id }: { id: string }) {
  return await prisma().document.findUnique({
    where: { id: id },
  });
}

function makeS3ClientForPresign() {
  const endpoint = process.env.S3_ENDPOINT_LOCAL || process.env.S3_ENDPOINT_LOCAL;
  const base = {
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: "test", secretAccessKey: "test" // pragma: allowlist secret
    },
  };
  return endpoint ? new S3Client({ ...base, endpoint }) : new S3Client(base);
}

async function createPresignedUploadUrl(key: string): Promise<string> {
  const s3 = makeS3ClientForPresign();
  const command = new PutObjectCommand({
    Bucket: process.env.UPLOAD_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

async function getPresignedUploadUrl(pending: PrismaDocumentPendingUpload): Promise<string> {
  const uploadKey = pending.id;
  return await createPresignedUploadUrl(uploadKey);
}

async function getPresignedDownloadUrl(doc: PrismaDocument): Promise<string> {
  const s3 = makeS3ClientForPresign();
  const command = new GetObjectCommand({
    Bucket: process.env.CLEAN_BUCKET,
    Key: `${doc.applicationId}/${doc.id}`,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

export const documentResolvers = {
  Query: {
    document: getDocument,
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

      const isLocalBypass = process.env.ENVIRONMENT ? process.env.ENVIRONMENT === "local" : false;
      if (isLocalBypass) {
        // Bypass S3 + queue: create a real Document immediately for local development
        const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-upload-bucket";
        const documentId = randomUUID();
        const uploadKey = `${input.applicationId}/${documentId}`;
        const s3Path = `s3://${uploadBucket}/${uploadKey}`;
        const document = await prisma().document.create({
          data: {
            id: documentId,
            name: input.name,
            description: input.description,
            ownerUserId: context.user.id,
            documentTypeId: input.documentType,
            applicationId: input.applicationId,
            phaseId: input.phaseName,
            s3Path,
            // any storage/path fields can be null or a local marker
          },
        });
        log.info(
          {
            documentId: document.id,
            applicationId: input.applicationId,
          },
          "Local upload bypass: created document directly"
        );
        const presignedURL = await createPresignedUploadUrl(uploadKey);

        return {
          presignedURL,
          localBypass: true,
          message: "Local upload detected; S3/queue bypassed.",
          documentId: document.id,
        };
      }
      console.log("-- DOCUMENT DATA --");
      console.log({
        name: input.name ?? "name empty",
        description: input.description ?? "description empty",
        userId: context.user.id ?? "id empty",
        documentType: input.documentType ?? "documentType empty",
        applicationId: input.applicationId ?? "applicationId empty",
        phaseName: input.phaseName ?? "phaseName empty",
      });

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
      return {
        presignedURL,
        localBypass: false,
        message: null,
        documentId: null,
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
