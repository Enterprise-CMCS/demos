import { Demonstration } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase, BundleStatus } from "../../types.js";
import { CreateDemonstrationInput, UpdateDemonstrationInput } from "./demonstrationSchema.js";
import { findUniqueUser } from "../user/userResolvers.js";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;
const conceptPhaseId: Phase = "Concept";
const newBundleStatusId: BundleStatus = "Pre-Submission";

export async function getDemonstration(parent: undefined, { id }: { id: string }) {
  return await prisma().demonstration.findUnique({
    where: { id: id },
  });
}

export async function getManyDemonstrations() {
  return await prisma().demonstration.findMany();
}

export async function createDemonstration(
  parent: undefined,
  { input }: { input: CreateDemonstrationInput }
) {
  return await prisma().$transaction(async (tx) => {
    const bundle = await tx.bundle.create({
      data: {
        bundleType: {
          connect: { id: demonstrationBundleTypeId },
        },
      },
    });

    try {
      await tx.demonstration.create({
        data: {
          id: bundle.id,
          bundleTypeId: bundle.bundleTypeId,
          name: input.name,
          description: input.description ?? "",
          cmcsDivisionId: input.cmcsDivision ?? undefined,
          signatureLevelId: input.signatureLevel ?? undefined,
          statusId: newBundleStatusId,
          stateId: input.stateId,
          currentPhaseId: conceptPhaseId,
          projectOfficerUserId: input.projectOfficerUserId,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: "Error creating demonstration: " + errorMessage,
      };
    }

    return {
      success: true,
      message: "Demonstration created successfully!",
    };
  });
}

export async function updateDemonstration(
  parent: undefined,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
) {
  return await prisma().demonstration.update({
    where: { id },
    data: {
      name: input.name ?? undefined,
      description: input.description ?? undefined,
      effectiveDate: input.effectiveDate ?? undefined,
      expirationDate: input.expirationDate ?? undefined,
      cmcsDivisionId: input.cmcsDivision ?? undefined,
      signatureLevelId: input.signatureLevel ?? undefined,
      statusId: input.status ?? undefined,
      currentPhaseId: input.currentPhase ?? undefined,
      stateId: input.stateId ?? undefined,
      projectOfficerUserId: input.projectOfficerUserId ?? undefined,
    },
  });
}

export const demonstrationResolvers = {
  Query: {
    demonstration: getDemonstration,
    demonstrations: getManyDemonstrations,
  },

  Mutation: {
    createDemonstration: createDemonstration,
    updateDemonstration: updateDemonstration,
    deleteDemonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstration.delete({
        where: { id: id },
      });
    },
  },

  Demonstration: {
    state: async (parent: Demonstration) => {
      return await prisma().state.findUnique({
        where: { id: parent.stateId },
      });
    },

    projectOfficer: async (parent: Demonstration) => {
      return await findUniqueUser(parent.projectOfficerUserId);
    },

    documents: async (parent: Demonstration) => {
      return await prisma().document.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },

    amendments: async (parent: Demonstration) => {
      return await prisma().modification.findMany({
        where: {
          demonstrationId: parent.id,
          bundleTypeId: amendmentBundleTypeId,
        },
      });
    },

    extensions: async (parent: Demonstration) => {
      return await prisma().modification.findMany({
        where: {
          demonstrationId: parent.id,
          bundleTypeId: extensionBundleTypeId,
        },
      });
    },

    cmcsDivision: async (parent: Demonstration) => {
      return parent.cmcsDivisionId;
    },

    signatureLevel: async (parent: Demonstration) => {
      return parent.signatureLevelId;
    },

    currentPhase: async (parent: Demonstration) => {
      return parent.currentPhaseId;
    },

    phases: async (parent: Demonstration) => {
      return await prisma().bundlePhase.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },
  },
};
