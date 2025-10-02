import { GraphQLError } from "graphql";

import { Document, DocumentPendingUpload } from "@prisma/client";
import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType } from "../../types.js";
import { UploadDocumentInput, UpdateDocumentInput } from "./documentSchema.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GraphQLContext } from "../../auth/auth.util.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

// We should look into caching this
// Otherwise, there are duplicative DB calls if requesting bundle and bundleType
async function getBundleTypeId(bundleId: string) {
  const result = await prisma().bundle.findUnique({
    where: { id: bundleId },
    select: {
      bundleType: {
        select: {
          id: true,
        },
      },
    },
  });
  return result!.bundleType.id;
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
          accessKeyId: "",
          secretAccessKey: "",
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
          accessKeyId: "",
          secretAccessKey: "",
        },
      }
    : {};
  const s3 = new S3Client(s3ClientConfig);
  const cleanBucket = process.env.CLEAN_BUCKET;
  const key = `${document.bundleId}/${document.id}`;
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
    document: async (_: undefined, { id }: { id: string }) => {
      return await prisma().document.findUnique({
        where: { id: id },
      });
    },
    documents: async (_: undefined, { bundleTypeId }: { bundleTypeId?: string }) => {
      if (bundleTypeId) {
        const isValidBundleType = Object.values(BUNDLE_TYPE).includes(bundleTypeId as BundleType);
        if (!isValidBundleType) {
          throw new GraphQLError("The requested bundle type is not valid.", {
            extensions: {
              code: "UNPROCESSABLE_ENTITY",
              http: { status: 422 },
            },
          });
        }
      }
      return await prisma().document.findMany({
        where: {
          bundle: {
            bundleType: {
              id: bundleTypeId,
            },
          },
        },
      });
    },
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
          bundleId: input.bundleId,
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
        ["name", "description", "documentType", "bundleId", "phaseName"],
        input
      );
      try {
        return await prisma().document.update({
          where: { id: id },
          data: {
            name: input.name,
            description: input.description,
            documentTypeId: input.documentType,
            bundleId: input.bundleId,
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

    bundle: async (parent: Document) => {
      return await getBundle(parent.bundleId);
    },

    bundleType: async (parent: Document) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      return bundleTypeId;
    },

    phaseName: async (parent: Document) => {
      return parent.phaseId;
    },
  },
};
