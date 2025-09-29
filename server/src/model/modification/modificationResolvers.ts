import { Modification } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleStatus, BundleType, Phase } from "../../types.js";
import {
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./modificationSchema.js";
import { resolveBundleStatus } from "../bundleStatus/bundleStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";

const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;
const conceptPhaseId: Phase = "Concept";
const newBundleStatusId: BundleStatus = "Pre-Submission";

async function getModification(
  parent: undefined,
  { id }: { id: string },
  context: undefined,
  info: undefined,
  bundleTypeId: typeof amendmentBundleTypeId | typeof extensionBundleTypeId
) {
  return await prisma().modification.findUnique({
    where: {
      id: id,
      bundleTypeId: bundleTypeId,
    },
  });
}
export async function getAmendment(
  parent: undefined,
  args: { id: string },
  context?: undefined,
  info?: undefined
) {
  return getModification(parent, args, context, info, amendmentBundleTypeId);
}
export async function getExtension(
  parent: undefined,
  args: { id: string },
  context?: undefined,
  info?: undefined
) {
  return getModification(parent, args, context, info, extensionBundleTypeId);
}

async function getManyModifications(
  parent: undefined,
  args: undefined,
  context: undefined,
  info: undefined,
  bundleTypeId: typeof amendmentBundleTypeId | typeof extensionBundleTypeId
) {
  return await prisma().modification.findMany({
    where: {
      bundleTypeId: bundleTypeId,
    },
  });
}
export async function getManyAmendments() {
  return getManyModifications(undefined, undefined, undefined, undefined, amendmentBundleTypeId);
}
export async function getManyExtensions() {
  return getManyModifications(undefined, undefined, undefined, undefined, extensionBundleTypeId);
}

async function createModification(
  parent: undefined,
  { input }: { input: CreateAmendmentInput | CreateExtensionInput },
  context: undefined,
  info: undefined,
  bundleTypeId: typeof amendmentBundleTypeId | typeof extensionBundleTypeId
) {
  return await prisma().$transaction(async (tx) => {
    const bundle = await tx.bundle.create({
      data: {
        bundleTypeId: bundleTypeId,
      },
    });

    return await tx.modification.create({
      data: {
        id: bundle.id,
        bundleTypeId: bundle.bundleTypeId,
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        statusId: newBundleStatusId,
        currentPhaseId: conceptPhaseId,
      },
    });
  });
}
export async function createAmendment(
  parent: undefined,
  args: { input: CreateAmendmentInput },
  context?: undefined,
  info?: undefined
) {
  return createModification(parent, args, context, info, amendmentBundleTypeId);
}
export async function createExtension(
  parent: undefined,
  args: { input: CreateExtensionInput },
  context?: undefined,
  info?: undefined
) {
  return createModification(parent, args, context, info, extensionBundleTypeId);
}

async function updateModification(
  parent: undefined,
  { id, input }: { id: string; input: UpdateAmendmentInput | UpdateExtensionInput },
  context: undefined,
  info: undefined,
  bundleTypeId: typeof amendmentBundleTypeId | typeof extensionBundleTypeId
) {
  checkOptionalNotNullFields(["demonstrationId", "name", "status", "currentPhase"], input);
  return await prisma().modification.update({
    where: {
      id: id,
      bundleTypeId: bundleTypeId,
    },
    data: {
      demonstrationId: input.demonstrationId,
      name: input.name,
      description: input.description,
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      statusId: input.status,
      currentPhaseId: input.currentPhase,
    },
  });
}
export async function updateAmendment(
  parent: undefined,
  args: { id: string; input: UpdateAmendmentInput },
  context?: undefined,
  info?: undefined
) {
  return updateModification(parent, args, context, info, amendmentBundleTypeId);
}
export async function updateExtension(
  parent: undefined,
  args: { id: string; input: UpdateExtensionInput },
  context?: undefined,
  info?: undefined
) {
  return updateModification(parent, args, context, info, extensionBundleTypeId);
}

async function getParentDemonstration(parent: Modification) {
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

async function getPhases(parent: Modification) {
  return await prisma().bundlePhase.findMany({
    where: {
      bundleId: parent.id,
    },
  });
}

export const modificationResolvers = {
  Query: {
    amendment: getAmendment,
    amendments: getManyAmendments,
    extension: getExtension,
    extensions: getManyExtensions,
  },

  Mutation: {
    createAmendment: createAmendment,
    updateAmendment: updateAmendment,
    deleteAmendment: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.delete({
        where: {
          id: id,
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },

    createExtension: createExtension,
    updateExtension: updateExtension,
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
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhase: getCurrentPhase,
    status: resolveBundleStatus,
    phases: getPhases,
  },

  Extension: {
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhase: getCurrentPhase,
    status: resolveBundleStatus,
    phases: getPhases,
  },
};
