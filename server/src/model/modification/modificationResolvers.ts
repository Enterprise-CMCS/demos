import { Modification } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase } from "../../types.js";
import {
  AddExtensionInput,
  CreateAmendmentInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./modificationSchema.js";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;
const conceptPhaseId: Phase = "Concept";

async function getDemonstration(parent: Modification) {
  return await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
}

async function getDocuments(parent: Modification) {
  return await prisma().document.findMany({
    where: {
      bundleId: parent.id,
    },
  });
}

async function getCurrentPhase(parent: Modification) {
  return parent.currentPhaseId;
}

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
      const { demonstrationId, amendmentStatusId, ...rest } = input;

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
            currentPhase: {
              connect: { id: conceptPhaseId },
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
      const { demonstrationId, amendmentStatusId, currentPhase, ...rest } = input;

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
          ...(currentPhase && {
            currentPhase: {
              connect: { id: currentPhase },
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
      const { demonstrationId, extensionStatusId, ...rest } = input;

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
            currentPhase: {
              connect: { id: conceptPhaseId },
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
      const { demonstrationId, extensionStatusId, currentPhase, ...rest } = input;

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
          ...(currentPhase && {
            currentPhase: {
              connect: { id: currentPhase },
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
    demonstration: getDemonstration,

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

    documents: getDocuments,
    currentPhase: getCurrentPhase,
  },

  Extension: {
    demonstration: getDemonstration,

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

    documents: getDocuments,
    currentPhase: getCurrentPhase,
  },
};
