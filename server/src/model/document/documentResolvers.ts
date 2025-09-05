import { GraphQLError } from "graphql";

import { Bundle, Document, DocumentPendingUpload } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType } from "../../types.js";
import { UploadDocumentInput, UpdateDocumentInput } from "./documentSchema.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;

// TODO: We should look into caching this
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

async function attachPresignedUploadUrl(document: DocumentPendingUpload) {
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
  const key = document.id;
  const command = new PutObjectCommand({
    Bucket: uploadBucket,
    Key: key,
  });
  const s3Path = await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });
  return { ...document, s3Path };
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
      _: undefined,
      { input }: { input: UploadDocumentInput }
    ) => {
      const { ownerUserId, documentTypeId, bundleId, ...rest } = input;
      const document = await prisma().documentPendingUpload.create({
        data: {
          ...rest,
          owner: { connect: { id: ownerUserId } },
          documentType: { connect: { id: documentTypeId } },
          bundle: { connect: { id: bundleId } },
        },
      });
      return await attachPresignedUploadUrl(document);
    },

    downloadDocument: async (
      _: undefined,
      { id }: { id: string }
    ) => {
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
      const { ownerUserId, documentTypeId, bundleId, ...rest } = input;
      return await prisma().document.update({
        where: { id: id },
        data: {
          ...rest,
          ...(ownerUserId && {
            owner: {
              connect: { id: ownerUserId },
            },
          }),
          ...(documentTypeId && {
            documentType: {
              connect: { id: documentTypeId },
            },
          }),
          ...(bundleId && {
            bundle: {
              connect: { id: bundleId },
            },
          }),
        },
      });
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
      return await prisma().user.findUnique({
        where: { id: parent.ownerUserId },
      });
    },

    documentType: async (parent: Document) => {
      return await prisma().documentType.findUnique({
        where: { id: parent.documentTypeId },
      });
    },

    // NOTE: Not checking for the bundle type being implemented here
    // This means if we add a bundle type to the DB and leave this untouched
    // It will fail silently
    bundle: async (parent: Document) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      if (bundleTypeId === demonstrationBundleTypeId) {
        return await prisma().demonstration.findUnique({
          where: { id: parent.bundleId },
        });
      } else if (bundleTypeId === amendmentBundleTypeId) {
        return await prisma().modification.findUnique({
          where: {
            id: parent.bundleId,
            bundleTypeId: amendmentBundleTypeId,
          },
        });
      } else if (bundleTypeId === extensionBundleTypeId) {
        return await prisma().modification.findUnique({
          where: {
            id: parent.bundleId,
            bundleTypeId: extensionBundleTypeId,
          },
        });
      } else {
        return null;
      }
    },

    bundleType: async (parent: Document) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      return bundleTypeId;
    },
  },

  Bundle: {
    __resolveType(obj: Bundle) {
      if (obj.bundleTypeId === demonstrationBundleTypeId) {
        return "Demonstration";
      } else if (obj.bundleTypeId === amendmentBundleTypeId) {
        return "Amendment";
      } else if (obj.bundleTypeId === extensionBundleTypeId) {
        return "Extension";
      }
    },
  },
};
