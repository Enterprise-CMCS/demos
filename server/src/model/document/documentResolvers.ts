import { prisma } from "../../prismaClient.js";
import { Document } from "@prisma/client";
import { BundleType } from "../../types.js";
import { BUNDLE_TYPE } from "../../constants.js";
import { GraphQLError } from "graphql";

// TODO: We should look into caching this
// Otherwise, there are duplicative DB calls if requesting bundle and bundleType
async function getBundleTypeId(bundleId: string) {
  const result = await prisma().bundle.findUnique({
    where: { id: bundleId },
    select: {
      bundleType: {
        select: {
          id: true
        }
      }
    }
  });
  return result!.bundleType.id;
};

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
        const implementedBundleTypes: BundleType[] = [BUNDLE_TYPE.DEMONSTRATION];
        const isImplementedBundleType = implementedBundleTypes.includes(bundleTypeId as BundleType);
        if (!isValidBundleType) {
          throw new GraphQLError("The requested bundle type is not valid.", {
            extensions: {
              code: "UNPROCESSABLE_ENTITY",
              http: { status: 422 }
            }
          })
        };
        if (!isImplementedBundleType) {
          throw new GraphQLError("The requested bundle type is not yet implemented.", {
            extensions: {
              code: "NOT_IMPLEMENTED",
              http: { status: 501 }
            }
          })
        };
      };
      return await prisma().document.findMany({
        where: {
          bundle: {
            bundleType: {
              id: bundleTypeId
            }
          }
        }
      });
    }
  },

  Document: {
    owner: async(parent: Document) => {
      return await prisma().user.findUnique({
        where: { id: parent.ownerUserId }
      });
    },

    documentType: async(parent: Document) => {
      return await prisma().documentType.findUnique({
        where: { id: parent.documentTypeId }
      });
    },

    // NOTE: Not checking for the bundle type being implemented here
    // This means if we add a bundle type to the DB and leave this untouched
    // It will fail silently
    bundle: async(parent: Document) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      if (bundleTypeId === BUNDLE_TYPE.DEMONSTRATION) {
        return await prisma().demonstration.findUnique({
          where: { id: parent.bundleId }
        });
      } else {
        return null;
      };
    },

    bundleType: async(parent: Document) => {
      const bundleTypeId = await getBundleTypeId(parent.bundleId);
      return bundleTypeId;
    }
  }
};
