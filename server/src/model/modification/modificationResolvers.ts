import { Modification } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  CreateAmendmentInput,
  UpdateAmendmentInput,
} from "./modificationSchema.js";
import { BUNDLE_TYPE } from "../../constants.js";
import { BundleType } from "../../types.js";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;

export const modificationResolvers = {
  Query: {
    amendment: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.findUnique({
        where: {
          id: id,
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },
    amendments: async () => {
      return await prisma().modification.findMany({
        where: {
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },
  },

  Mutation: {
    createAmendment: async (
      _: undefined,
      { input }: { input: CreateAmendmentInput },
    ) => {
      const {
        demonstrationId,
        amendmentStatusId,
        projectOfficerUserId,
        ...rest
      } = input;

      return await prisma().$transaction(async (tx) => {
        const bundle = await tx.bundle.create({
          data: {
            bundleType: {
              connect: { id: amendmentBundleTypeId },
            },
          },
        });

        return await tx.modification.create({
          data: {
            bundle: {
              connect: { id: bundle.id },
            },
            bundleType: {
              connect: { id: amendmentBundleTypeId },
            },
            demonstration: {
              connect: { id: demonstrationId },
            },
            modificationStatus: {
              connect: {
                modificationStatusId: {
                  id: amendmentStatusId,
                  bundleTypeId: amendmentBundleTypeId,
                },
              },
            },
            projectOfficer: {
              connect: { id: projectOfficerUserId },
            },
            ...rest,
          },
        });
      });
    },

    updateAmendment: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateAmendmentInput },
    ) => {
      const {
        demonstrationId,
        amendmentStatusId,
        projectOfficerUserId,
        ...rest
      } = input;

      return await prisma().modification.update({
        where: {
          id: id,
          bundleTypeId: amendmentBundleTypeId,
        },
        data: {
          ...(demonstrationId && {
            demonstration: {
              connect: { id: demonstrationId },
            },
          }),
          ...(amendmentStatusId && {
            modificationStatus: {
              connect: {
                modificationStatusId: {
                  id: amendmentStatusId,
                  bundleTypeId: amendmentBundleTypeId,
                },
              },
            },
          }),
          ...(projectOfficerUserId && {
            projectOfficer: {
              connect: { id: projectOfficerUserId },
            },
          }),
          ...rest,
        },
      });
    },

    deleteAmendment: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.delete({
        where: {
          id: id,
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },
  },

  Amendment: {
    amendmentStatus: async (parent: Modification) => {
      return await prisma().modificationStatus.findUnique({
        where: {
          modificationStatusId: {
            id: parent.modificationStatusId,
            bundleTypeId: amendmentBundleTypeId,
          },
        },
      });
    },

    projectOfficer: async (parent: Modification) => {
      return await prisma().user.findUnique({
        where: { id: parent.projectOfficerUserId },
      });
    },

    documents: async (parent: Modification) => {
      return await prisma().document.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },
  },
};
