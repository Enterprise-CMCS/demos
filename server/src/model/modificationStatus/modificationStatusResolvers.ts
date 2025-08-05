import { ModificationStatus } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType } from "../../types.js";
import {
  AddExtensionStatusInput,
  CreateAmendmentStatusInput,
  UpdateAmendmentStatusInput,
  UpdateExtensionStatusInput,
} from "./modificationStatusSchema.js";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;

export const modificationStatusResolvers = {
  Query: {
    amendmentStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.findUnique({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: amendmentBundleTypeId,
          },
        },
      });
    },
    amendmentStatuses: async () => {
      return await prisma().modificationStatus.findMany({
        where: {
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },
    extensionStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.findUnique({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: extensionBundleTypeId,
          },
        },
      });
    },
    extensionStatuses: async () => {
      return await prisma().modificationStatus.findMany({
        where: {
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },
  },

  Mutation: {
    createAmendmentStatus: async (
      _: undefined,
      { input }: { input: CreateAmendmentStatusInput },
    ) => {
      return await prisma().modificationStatus.create({
        data: {
          id: input.id,
          bundleTypeId: amendmentBundleTypeId,
          name: input.name,
          description: input.description,
        },
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
            bundleTypeId: amendmentBundleTypeId,
          },
        },
        data: input,
      });
    },

    deleteAmendmentStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.delete({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: amendmentBundleTypeId,
          },
        },
      });
    },
    addExtensionStatus: async (
      _: undefined,
      { input }: { input: AddExtensionStatusInput },
    ) => {
      return await prisma().modificationStatus.create({
        data: {
          id: input.id,
          bundleTypeId: extensionBundleTypeId,
          name: input.name,
          description: input.description,
        },
      });
    },
    updateExtensionStatus: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateExtensionStatusInput },
    ) => {
      return await prisma().modificationStatus.update({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: extensionBundleTypeId,
          },
        },
        data: input,
      });
    },
    deleteExtensionStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modificationStatus.delete({
        where: {
          modificationStatusId: {
            id: id,
            bundleTypeId: extensionBundleTypeId,
          },
        },
      });
    },
  },

  AmendmentStatus: {
    amendments: async (parent: ModificationStatus) => {
      return await prisma().modification.findMany({
        where: {
          modificationStatusId: parent.id,
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },
  },
  ExtensionStatus: {
    extensions: async (parent: ModificationStatus) => {
      return await prisma().modification.findMany({
        where: {
          modificationStatusId: parent.id,
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },
  },
};
