import { State } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { resolveUser } from "../user/userResolvers.js";

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
          user: {
            include: { person: true },
          },
        },
      });
      const users = userStates.map((userState) => userState.user);
      return users.map(resolveUser);
    },
    demonstrations: async (parent: State) => {
      return await prisma().demonstration.findMany({
        where: { stateId: parent.id },
      });
    },
  },
};
