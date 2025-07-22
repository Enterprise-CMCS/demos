import { prisma } from "../../prismaClient.js";
import {
  AddAmendmentStatusInput,
  UpdateAmendmentStatusInput
} from "./modificationStatusSchema.js";
import { BUNDLE_TYPE } from "../../constants.js";
import { BundleType } from "../../types.js";
import { ModificationStatus } from "@prisma/client";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;

export const modificationStatusResolvers = {
  Query: {
    getAmendmentStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.findUnique({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: amendmentBundleTypeId
          }
        }
      });
    },
    getAmendmentStatuses: async () => {
      return await prisma().modificationStatus.findMany({
        where: {
          bundleTypeId: amendmentBundleTypeId
        }
      });
    },
  },

  Mutation: {
    addAmendmentStatus: async (
      _: undefined,
      { input }: { input: AddAmendmentStatusInput },
    ) => {
      return await prisma().modificationStatus.create({
        data: {
          id: input.id,
          bundleTypeId: amendmentBundleTypeId,
          description: input.description
        }
      });
    },

    updateAmendmentStatus: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateAmendmentStatusInput },
    ) => {
      return await prisma().modificationStatus.update({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: amendmentBundleTypeId
          }
        },
        data: input,
      });
    },

    deleteAmendmentStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.delete({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: amendmentBundleTypeId
          }
        }
      });
    },
  },

  AmendmentStatus: {
    amendments: async (parent: ModificationStatus) => {
      return await prisma().modification.findMany({
        where: {
          modificationStatusId: parent.id,
          bundleTypeId: amendmentBundleTypeId
        }
      });
    },
  },
};
