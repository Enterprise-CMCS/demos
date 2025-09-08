import { Demonstration, Person, User } from "@prisma/client";

import { BUNDLE_TYPE } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { BundleType } from "../../types.js";
import { CreateDemonstrationInput, UpdateDemonstrationInput } from "./demonstrationSchema.js";
import { resolveUser } from "../user/userResolvers.js";

const demonstrationBundleTypeId: BundleType = BUNDLE_TYPE.DEMONSTRATION;
const amendmentBundleTypeId: BundleType = BUNDLE_TYPE.AMENDMENT;
const extensionBundleTypeId: BundleType = BUNDLE_TYPE.EXTENSION;

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
      const {
        demonstrationStatusId,
        stateId,
        userIds,
        projectOfficerUserId,
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

        return await tx.demonstration.create({
          data: {
            ...rest,
            bundle: {
              connect: { id: bundle.id },
            },
            bundleType: {
              connect: { id: demonstrationBundleTypeId },
            },
            cmcsDivision: {
              connect: { id: cmcsDivision },
            },
            signatureLevel: {
              connect: { id: signatureLevel },
            },
            demonstrationStatus: {
              connect: { id: demonstrationStatusId },
            },
            state: {
              connect: { id: stateId },
            },
            ...(userIds &&
              stateId && {
                userStateDemonstrations: {
                  create: userIds.map((userId: string) => ({
                    userId,
                    stateId,
                  })),
                },
              }),
            projectOfficer: {
              connect: { id: projectOfficerUserId },
            },
          },
        });
      });
    },

    updateDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationInput }
    ) => {
      const {
        demonstrationStatusId,
        userIds,
        stateId,
        projectOfficerUserId,
        effectiveDate,
        expirationDate,
        cmcsDivision,
        signatureLevel,
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
          ...(userIds &&
            existingStateId && {
              userStateDemonstrations: {
                create: userIds.map((userId: string) => ({
                  userId,
                  stateId: existingStateId,
                })),
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

    users: async (parent: Demonstration) => {
      const userStateDemonstrations = await prisma().userStateDemonstration.findMany({
        where: { demonstrationId: parent.id, stateId: parent.stateId },
        include: {
          user: {
            include: {
              person: true,
            },
          },
        },
      });

      interface UserStateDemonstrationWithUser {
        user: User & { person: Person };
      }

      return userStateDemonstrations.map(
        (userStateDemonstration: UserStateDemonstrationWithUser) => ({
          ...userStateDemonstration.user,
          ...userStateDemonstration.user.person,
        })
      );
    },

    projectOfficer: async (parent: Demonstration) => {
      const user = await prisma().user.findUnique({
        where: { id: parent.projectOfficerUserId },
        include: { person: true },
      });
      if (!user) return null;
      return resolveUser(user);
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
  },
};
