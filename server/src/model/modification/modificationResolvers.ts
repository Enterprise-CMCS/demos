import { Modification } from "@prisma/client";

import { prisma } from "../../prismaClient.js";
import { BundleStatus, BundleType, PhaseName } from "../../types.js";
import {
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./modificationSchema.js";
import { resolveBundleStatus } from "../bundleStatus/bundleStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

type ModificationType = Exclude<BundleType, "Demonstration">;
const conceptPhaseName: PhaseName = "Concept";
const newBundleStatusId: BundleStatus = "Pre-Submission";

async function getModification(
  parent: undefined,
  { id }: { id: string },
  context: undefined,
  info: undefined,
  bundleTypeId: ModificationType
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
  return getModification(parent, args, context, info, "Amendment");
}
export async function getExtension(
  parent: undefined,
  args: { id: string },
  context?: undefined,
  info?: undefined
) {
  return getModification(parent, args, context, info, "Extension");
}

async function getManyModifications(
  parent: undefined,
  args: undefined,
  context: undefined,
  info: undefined,
  bundleTypeId: ModificationType
) {
  return await prisma().modification.findMany({
    where: {
      bundleTypeId: bundleTypeId,
    },
  });
}
export async function getManyAmendments() {
  return getManyModifications(undefined, undefined, undefined, undefined, "Amendment");
}
export async function getManyExtensions() {
  return getManyModifications(undefined, undefined, undefined, undefined, "Extension");
}

async function createModification(
  parent: undefined,
  { input }: { input: CreateAmendmentInput | CreateExtensionInput },
  context: undefined,
  info: undefined,
  bundleTypeId: ModificationType
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
        currentPhaseId: conceptPhaseName,
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
  return createModification(parent, args, context, info, "Amendment");
}
export async function createExtension(
  parent: undefined,
  args: { input: CreateExtensionInput },
  context?: undefined,
  info?: undefined
) {
  return createModification(parent, args, context, info, "Extension");
}

async function updateModification(
  parent: undefined,
  { id, input }: { id: string; input: UpdateAmendmentInput | UpdateExtensionInput },
  context: undefined,
  info: undefined,
  bundleTypeId: ModificationType
) {
  checkOptionalNotNullFields(["demonstrationId", "name", "status", "currentPhaseName"], input);
  try {
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
        currentPhaseId: input.currentPhaseName,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}
export async function updateAmendment(
  parent: undefined,
  args: { id: string; input: UpdateAmendmentInput },
  context?: undefined,
  info?: undefined
) {
  return updateModification(parent, args, context, info, "Amendment");
}
export async function updateExtension(
  parent: undefined,
  args: { id: string; input: UpdateExtensionInput },
  context?: undefined,
  info?: undefined
) {
  return updateModification(parent, args, context, info, "Extension");
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
          bundleTypeId: "Amendment" satisfies BundleType,
        },
      });
    },

    createExtension: createExtension,
    updateExtension: updateExtension,
    deleteExtension: async (_: undefined, { id }: { id: string }) => {
      return await prisma().modification.delete({
        where: {
          id: id,
          bundleTypeId: "Extension" satisfies BundleType,
        },
      });
    },
  },

  Amendment: {
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhaseName: getCurrentPhase,
    status: resolveBundleStatus,
    phases: getPhases,
  },

  Extension: {
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhaseName: getCurrentPhase,
    status: resolveBundleStatus,
    phases: getPhases,
  },
};
