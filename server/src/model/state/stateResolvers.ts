import { State } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { AddStateInput, UpdateStateInput } from "./stateSchema.js";

export const stateResolvers = {
  Query: {
    state: async (_: undefined, { id }: { id: string }) => {
      return await prisma.state.findUnique({
        where: { id: id },
      });
    },
    states: async () => {
      return await prisma.state.findMany();
    },
  },

  Mutation: {
    addState: async (_: undefined, { input }: { input: AddStateInput }) => {
      const { userIds, ...rest } = input;
      return await prisma.state.create({
        data: {
          ...rest,
          ...(userIds && {
            userStates: {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            },
          }),
        },
      });
    },

    updateState: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateStateInput },
    ) => {
      const { userIds, ...rest } = input;
      return await prisma.state.update({
        where: { id },
        data: {
          ...rest,
          ...(userIds && {
            userStates: {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            },
          }),
        },
      });
    },

    deleteState: async (_: undefined, { id }: { id: string }) => {
      return await prisma.state.delete({
        where: { id: id },
      });
    },
  },

  State: {
    users: async (parent: State) => {
      const userStates = await prisma.userState.findMany({
        where: { stateId: parent.id },
        include: {
          user: true,
        },
      });
      return userStates.map((userState) => userState.user);
    },
    demonstrations: async (parent: State) => {
      return await prisma.demonstration.findMany({
        where: { stateId: parent.id },
      });
    },
  },
};
