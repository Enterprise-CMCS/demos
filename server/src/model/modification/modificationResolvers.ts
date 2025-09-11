import { Modification } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType } from "../../types.js";
import {
  AddExtensionInput,
  CreateAmendmentInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./modificationSchema.js";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;

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
    extension: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.findUnique({
        where: {
          id: id,
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },
    extensions: async () => {
      return await prisma().modification.findMany({
        where: {
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },
  },

  Mutation: {
    createAmendment: async (_: undefined, { input }: { input: CreateAmendmentInput }) => {
      const { demonstrationId, amendmentStatusId, projectOfficerUserId, ...rest } = input;

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
      { id, input }: { id: string; input: UpdateAmendmentInput }
    ) => {
      const { demonstrationId, amendmentStatusId, projectOfficerUserId, ...rest } = input;

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

    addExtension: async (_: undefined, { input }: { input: AddExtensionInput }) => {
      const { demonstrationId, extensionStatusId, projectOfficerUserId, ...rest } = input;

      return await prisma().$transaction(async (tx) => {
        const bundle = await tx.bundle.create({
          data: {
            bundleType: {
              connect: { id: extensionBundleTypeId },
            },
          },
        });

        return await tx.modification.create({
          data: {
            bundle: {
              connect: { id: bundle.id },
            },
            bundleType: {
              connect: { id: extensionBundleTypeId },
            },
            demonstration: {
              connect: { id: demonstrationId },
            },
            modificationStatus: {
              connect: {
                modificationStatusId: {
                  id: extensionStatusId,
                  bundleTypeId: extensionBundleTypeId,
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

    updateExtension: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateExtensionInput }
    ) => {
      const { demonstrationId, extensionStatusId, projectOfficerUserId, ...rest } = input;

      return await prisma().modification.update({
        where: {
          id: id,
          bundleTypeId: extensionBundleTypeId,
        },
        data: {
          ...(demonstrationId && {
            demonstration: {
              connect: { id: demonstrationId },
            },
          }),
          ...(extensionStatusId && {
            modificationStatus: {
              connect: {
                modificationStatusId: {
                  id: extensionStatusId,
                  bundleTypeId: extensionBundleTypeId,
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

    deleteExtension: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.delete({
        where: {
          id: id,
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },
  },

  Amendment: {
    demonstration: async (parent: Modification) => {
      return await prisma().demonstration.findUnique({
        where: { id: parent.demonstrationId },
      });
    },

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
  Extension: {
    demonstration: async (parent: Modification) => {
      return await prisma().demonstration.findUnique({
        where: { id: parent.demonstrationId },
      });
    },

    extensionStatus: async (parent: Modification) => {
      return await prisma().modificationStatus.findUnique({
        where: {
          modificationStatusId: {
            id: parent.modificationStatusId,
            bundleTypeId: extensionBundleTypeId,
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
