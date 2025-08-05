import { prisma } from "../../prismaClient.js";
import { Bundle, Document } from "@prisma/client";
import { BundleType } from "../../types.js";
import { BUNDLE_TYPE } from "../../constants.js";
import { GraphQLError } from "graphql";
import {
  CreateDemonstrationDocumentInput,
  UpdateDemonstrationDocumentInput,
  UpdateAmendmentDocumentInput,
  UploadAmendmentDocumentInput,
} from "./documentSchema.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;

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

export const documentResolvers = {
  Query: {
    document: async (_: undefined, { id }: { id: string }) => {
      return await prisma().document.findUnique({
        where: { id: id },
      });
    },
    documents: async (
      _: undefined,
      { bundleTypeId }: { bundleTypeId?: string },
    ) => {
      if (bundleTypeId) {
        const isValidBundleType = Object.values(BUNDLE_TYPE).includes(
          bundleTypeId as BundleType,
        );
        const implementedBundleTypes: BundleType[] = [
          demonstrationBundleTypeId,
          amendmentBundleTypeId,
        ];
        const isImplementedBundleType = implementedBundleTypes.includes(
          bundleTypeId as BundleType,
        );
        if (!isValidBundleType) {
          throw new GraphQLError("The requested bundle type is not valid.", {
            extensions: {
              code: "UNPROCESSABLE_ENTITY",
              http: { status: 422 },
            },
          });
        }
        if (!isImplementedBundleType) {
          throw new GraphQLError(
            "The requested bundle type is not yet implemented.",
            {
              extensions: {
                code: "NOT_IMPLEMENTED",
                http: { status: 501 },
              },
            },
          );
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
    createDemonstrationDocument: async (
      _: undefined,
      { input }: { input: CreateDemonstrationDocumentInput },
    ) => {
      const { ownerUserId, documentTypeId, demonstrationId, ...rest } = input;
      return await prisma().document.create({
        data: {
          ...rest,
          owner: {
            connect: { id: ownerUserId },
          },
          documentType: {
            connect: { id: documentTypeId },
          },
          bundle: {
            connect: { id: demonstrationId },
          },
        },
      });
    },

    updateDemonstrationDocument: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationDocumentInput },
    ) => {
      const { ownerUserId, documentTypeId, demonstrationId, ...rest } = input;
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
          ...(demonstrationId && {
            bundle: {
              connect: { id: demonstrationId },
            },
          }),
        },
      });
    },

    deleteDemonstrationDocument: async (
      _: undefined,
      { id }: { id: string },
    ) => {
      return await prisma().document.delete({
        where: { id: id },
      });
    },

    uploadAmendmentDocument: async (
      _: undefined,
      { input }: { input: UploadAmendmentDocumentInput },
    ) => {
      const { ownerUserId, documentTypeId, amendmentId, ...rest } = input;
      const documentPendingUpload = await prisma().documentPendingUpload.create(
        {
          data: {
            ...rest,
            owner: {
              connect: { id: ownerUserId },
            },
            documentType: {
              connect: { id: documentTypeId },
            },
            bundle: {
              connect: { id: amendmentId },
            },
          },
        },
      );

      const uploadResult = documentPendingUpload as Document;
      // Generate a presigned S3 upload URL
      const s3 = new S3Client({
        region: "us-east-1",
        endpoint: "http://localstack:4566",
        forcePathStyle: true,
        credentials: {
          accessKeyId: "",
          secretAccessKey: "",
        },
      });
      const uploadBucket = process.env.UPLOAD_BUCKET;
      const key = uploadResult.id;
      const command = new PutObjectCommand({
        Bucket: uploadBucket,
        Key: key,
      });
      uploadResult.s3Path = await getSignedUrl(s3, command, {
        expiresIn: 3600,
      });

      return {
        ...uploadResult,
      };
    },

    updateAmendmentDocument: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateAmendmentDocumentInput },
    ) => {
      const { ownerUserId, documentTypeId, amendmentId, ...rest } = input;
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
          ...(amendmentId && {
            bundle: {
              connect: { id: amendmentId },
            },
          }),
        },
      });
    },

    deleteAmendmentDocument: async (_: undefined, { id }: { id: string }) => {
      return await prisma().document.delete({
        where: { id: id },
      });
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
      }
    },
  },
};
