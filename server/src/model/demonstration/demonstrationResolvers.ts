import { Demonstration } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase } from "../../types.js";
import { CreateDemonstrationInput, UpdateDemonstrationInput } from "./demonstrationSchema.js";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;
const conceptPhaseId: Phase = "Concept";

export const demonstrationResolvers = {
  Query: {
    demonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstration.findUnique({
        where: { id: id },
      });
    },
    demonstrations: async () => {
      return await prisma().demonstration.findMany();
    },
  },

  Mutation: {
    createDemonstration: async (_: undefined, { input }: { input: CreateDemonstrationInput }) => {
      const { stateId, projectOfficerUserId, description, cmcsDivision, signatureLevel, ...rest } =
        input;

      try {
        await prisma().$transaction(async (tx) => {
          const bundle = await tx.bundle.create({
            data: {
              bundleTypeId: demonstrationBundleTypeId,
            },
          });
          await tx.demonstration.create({
            data: {
              ...rest,
              description: description || "",
              id: bundle.id,
              bundleTypeId: demonstrationBundleTypeId,
              demonstrationStatusId: "DEMONSTRATION_NEW",
              stateId: stateId,
              currentPhaseId: conceptPhaseId,
              ...(cmcsDivision && {
                cmcsDivisionId: cmcsDivision,
              }),
              ...(signatureLevel && {
                signatureLevelId: signatureLevel,
              }),
            },
          });

          await tx.demonstrationRoleAssignment.create({
            data: {
              demonstrationId: bundle.id,
              personId: projectOfficerUserId,
              roleId: "Project Officer",
              stateId: stateId,
              personTypeId: "Project Officer",
              grantLevelId: "Demonstration",
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
    },

    updateDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationInput }
    ) => {
      const {
        demonstrationStatusId,
        stateId,
        effectiveDate,
        expirationDate,
        cmcsDivision,
        signatureLevel,
        currentPhase,
        ...rest
      } = input;

      return await prisma().demonstration.update({
        where: { id },
        data: {
          ...rest,
          ...(effectiveDate && {
            effectiveDate: new Date(effectiveDate),
          }),
          ...(expirationDate && {
            expirationDate: new Date(expirationDate),
          }),
          ...(cmcsDivision && {
            cmcsDivisionId: cmcsDivision,
          }),
          ...(signatureLevel && {
            signatureLevelId: signatureLevel,
          }),
          ...(demonstrationStatusId && {
            demonstrationStatusId: demonstrationStatusId,
          }),
          ...(stateId && {
            stateId: stateId,
          }),
          ...(currentPhase && {
            currentPhaseId: currentPhase,
          }),
        },
      });
    },

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

    demonstrationStatus: async (parent: Demonstration) => {
      return await prisma().demonstrationStatus.findUnique({
        where: { id: parent.demonstrationStatusId },
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
  },
};
