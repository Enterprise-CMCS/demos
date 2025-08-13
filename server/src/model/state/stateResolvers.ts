import { State } from "@prisma/client";
import { prisma } from "../../prismaClient.js";

export const stateResolvers = {
  Query: {
    state: async (_: undefined, { id }: { id: string }) => {
      return await prisma().state.findUnique({
        where: { id: id },
      });
    },
    states: async () => {
      return await prisma().state.findMany();
    },
  },

  State: {
    users: async (parent: State) => {
      const userStates = await prisma().userState.findMany({
        where: { stateId: parent.id },
        include: {
          user: true,
        },
      });
      return userStates.map((userState) => userState.user);
    },
    demonstrations: async (parent: State) => {
      return await prisma().demonstration.findMany({
        where: { stateId: parent.id },
      });
    },
  },
};
