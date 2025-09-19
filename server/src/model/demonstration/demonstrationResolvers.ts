import { Demonstration } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase, BundleStatus } from "../../types.js";
import { CreateDemonstrationInput, UpdateDemonstrationInput } from "./demonstrationSchema.js";
import { resolveBundleStatus } from "../bundleStatus/bundleStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";

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
  try {
    await prisma().$transaction(async (tx) => {
      const bundle = await tx.bundle.create({
        data: {
          bundleTypeId: demonstrationBundleTypeId,
        },
      });

      await tx.demonstration.create({
        data: {
          id: bundle.id,
          bundleTypeId: bundle.bundleTypeId,
          name: input.name,
          description: input.description,
          cmcsDivisionId: input.cmcsDivision,
          signatureLevelId: input.signatureLevel,
          statusId: newBundleStatusId,
          stateId: input.stateId,
          currentPhaseId: conceptPhaseId,
        },
      });

      const person = await tx.person.findUnique({
        where: { id: input.projectOfficerUserId },
        select: { personTypeId: true },
      });

      if (!person) {
        throw new Error(`Person with id ${input.projectOfficerUserId} not found`);
      }

      await tx.demonstrationRoleAssignment.create({
        data: {
          demonstrationId: bundle.id,
          personId: input.projectOfficerUserId,
          personTypeId: person.personTypeId,
          roleId: "Project Officer",
          stateId: input.stateId,
          grantLevelId: "Demonstration",
        },
      });

      await tx.primaryDemonstrationRoleAssignment.create({
        data: {
          demonstrationId: bundle.id,
          personId: input.projectOfficerUserId,
          roleId: "Project Officer",
        },
      });
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
}

export async function updateDemonstration(
  parent: undefined,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
) {
  checkOptionalNotNullFields(["name", "status", "currentPhase", "stateId"], input);
  return await prisma().demonstration.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      cmcsDivisionId: input.cmcsDivision,
      signatureLevelId: input.signatureLevel,
      statusId: input.status,
      currentPhaseId: input.currentPhase,
      stateId: input.stateId,
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

    roles: async (parent: Demonstration) => {
      const roleAssignments = await prisma().demonstrationRoleAssignment.findMany({
        where: { demonstrationId: parent.id },
        include: { primaryDemonstrationRoleAssignment: true },
      });
      return roleAssignments.map((assignment) => ({
        ...assignment,
        isPrimary: !!assignment.primaryDemonstrationRoleAssignment,
      }));
    },
    status: resolveBundleStatus,

    phases: async (parent: Demonstration) => {
      return await prisma().bundlePhase.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },
  },
};
