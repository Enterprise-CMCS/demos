import { Demonstration } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase } from "../../types.js";
import {
  CreateDemonstrationInput,
  UpdateDemonstrationInput,
} from "./demonstrationSchema.js";
import { findUniqueUser } from "../user/userResolvers.js";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;
const conceptPhaseId: Phase = "Concept";

export async function getDemonstration(_: undefined, { id }: { id: string }) {
  return await prisma().demonstration.findUnique({
    where: { id: id },
  });
}

export const demonstrationResolvers = {
  Query: {
    demonstration: getDemonstration,
    demonstrations: async () => {
      return await prisma().demonstration.findMany();
    },
  },

  Mutation: {
    createDemonstration: async (
      _: undefined,
      { input }: { input: CreateDemonstrationInput },
    ) => {
      const {
        stateId,
        projectOfficerUserId,
        description,
        cmcsDivision,
        signatureLevel,
        ...rest
      } = input;

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
              ...rest,
              description: description || "",
              bundle: {
                connect: { id: bundle.id },
              },
              bundleType: {
                connect: { id: demonstrationBundleTypeId },
              },
              ...(cmcsDivision && {
                cmcsDivision: {
                  connect: { id: cmcsDivision },
                },
              }),
              ...(signatureLevel && {
                signatureLevel: {
                  connect: { id: signatureLevel },
                },
              }),
              demonstrationStatus: {
                connect: { id: "DEMONSTRATION_NEW" },
              },
              state: {
                connect: { id: stateId },
              },
              currentPhase: {
                connect: { id: conceptPhaseId },
              },
              projectOfficer: {
                connect: { id: projectOfficerUserId },
              },
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
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
    },

    updateDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationInput },
    ) => {
      const {
        demonstrationStatusId,
        stateId,
        projectOfficerUserId,
        effectiveDate,
        expirationDate,
        cmcsDivision,
        signatureLevel,
        currentPhase,
        ...rest
      } = input;

      let existingStateId = stateId;
      if (!existingStateId) {
        existingStateId = (
          await prisma().demonstration.findUnique({
            where: { id },
            select: { stateId: true },
          })
        )?.stateId;
      }

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
            cmcsDivision: {
              connect: { id: cmcsDivision },
            },
          }),
          ...(signatureLevel && {
            signatureLevel: {
              connect: { id: signatureLevel },
            },
          }),
          ...(demonstrationStatusId && {
            demonstrationStatus: {
              connect: { id: demonstrationStatusId },
            },
          }),
          ...(stateId && {
            state: {
              connect: { id: stateId },
            },
          }),
          ...(currentPhase && {
            currentPhase: {
              connect: { id: currentPhase },
            },
          }),
          ...(projectOfficerUserId && {
            projectOfficer: {
              connect: { id: projectOfficerUserId },
            },
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
