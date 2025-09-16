import { Demonstration } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType, Phase } from "../../types.js";
import {
  CreateDemonstrationInput,
  UpdateDemonstrationInput,
  AddPeopleToDemonstrationInput,
  RemovePeopleFromDemonstrationInput,
} from "./demonstrationSchema.js";

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
              bundleType: {
                connect: { id: demonstrationBundleTypeId },
              },
            },
          });
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
        },
      });
    },

    deleteDemonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstration.delete({
        where: { id: id },
      });
    },

    addPeopleToDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: AddPeopleToDemonstrationInput[] }
    ) => {
      await prisma().$transaction(async (tx) => {
        const demonstration = await tx.demonstration.findUnique({
          where: { id },
        });

        if (!demonstration) {
          throw new Error(`Demonstration with id ${id} not found`);
        }

        for (const roleAssignment of input) {
          const person = await tx.person.findUnique({
            where: { id: roleAssignment.personId },
          });

          if (!person) {
            console.log(`Reached Error`);
            throw new Error(`Person with id ${roleAssignment.personId} not found`);
          }

          await tx.demonstrationRoleAssignment.create({
            data: {
              personId: roleAssignment.personId,
              demonstrationId: demonstration.id,
              roleId: roleAssignment.role,
              stateId: demonstration.stateId,
              personTypeId: person.personTypeId,
              grantLevelId: "Demonstration",
            },
          });

          if (roleAssignment.isPrimary) {
            await tx.primaryDemonstrationRoleAssignment.create({
              data: {
                personId: roleAssignment.personId,
                demonstrationId: demonstration.id,
                roleId: roleAssignment.role,
              },
            });
          }
        }
      });

      return await prisma().demonstration.findUnique({
        where: { id },
      });
    },

    removePeopleFromDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: RemovePeopleFromDemonstrationInput[] }
    ) => {
      for (const demonstrationAssignment of input) {
        await prisma().primaryDemonstrationRoleAssignment.deleteMany({
          where: {
            demonstrationId: id,
            personId: demonstrationAssignment.personId,
            roleId: demonstrationAssignment.role,
          },
        });

        await prisma().demonstrationRoleAssignment.deleteMany({
          where: {
            demonstrationId: id,
            personId: demonstrationAssignment.personId,
            roleId: demonstrationAssignment.role,
          },
        });
      }

      return await prisma().demonstration.findUnique({
        where: { id },
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
