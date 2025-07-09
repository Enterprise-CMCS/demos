import { Demonstration, User } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  AddDemonstrationInput,
  UpdateDemonstrationInput,
} from "./demonstrationSchema.js";

export const demonstrationResolvers = {
  Query: {
    demonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma.demonstration.findUnique({
        where: { id: id },
      });
    },
    demonstrations: async () => {
      return await prisma.demonstration.findMany();
    },
  },

  Mutation: {
    addDemonstration: async (
      _: undefined,
      { input }: { input: AddDemonstrationInput },
    ) => {
      const { demonstrationStatusId, stateId, userIds, ...rest } = input;
      return await prisma.demonstration.create({
        data: {
          ...rest,
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
        },
      });
    },

    updateDemonstration: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationInput },
    ) => {
      const { demonstrationStatusId, userIds, stateId, ...rest } = input;

      // If stateId is not provided, use the demonstration's existing stateId
      let existingStateId = stateId;
      if (!existingStateId) {
        existingStateId = (
          await prisma.demonstration.findUnique({
            where: { id },
            select: { stateId: true },
          })
        )?.stateId;
      }

      return await prisma.demonstration.update({
        where: { id },
        data: {
          ...rest,
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
        },
      });
    },

    deleteDemonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma.demonstration.delete({
        where: { id: id },
      });
    },
  },

  Demonstration: {
    state: async (parent: Demonstration) => {
      return await prisma.state.findUnique({
        where: { id: parent.stateId },
      });
    },

    demonstrationStatus: async (parent: Demonstration) => {
      return await prisma.demonstrationStatus.findUnique({
        where: { id: parent.demonstrationStatusId },
      });
    },

    users: async (parent: Demonstration) => {
      const userStateDemonstrations =
        await prisma.userStateDemonstration.findMany({
          where: { demonstrationId: parent.id, stateId: parent.stateId },
          include: {
            user: true,
          },
        });

      interface UserStateDemonstrationWithUser {
        user: User;
      }

      return userStateDemonstrations.map(
        (userStateDemonstration: UserStateDemonstrationWithUser) => userStateDemonstration.user,
      );
    },

    projectOfficer: async (parent: Demonstration) => {
      if (!parent) return null;
      return await prisma.user.findUnique({
        where: { id: parent.projectOfficer },
      });
    },
  },
};
