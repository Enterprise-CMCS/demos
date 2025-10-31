import { State as PrismaState } from "@prisma/client";
import { prisma } from "../../prismaClient.js";

export const stateResolvers = {
  Query: {
    state: async (_: unknown, { id }: { id: string }) => {
      return await prisma().state.findUnique({
        where: { id: id },
      });
    },
    states: async () => {
      return await prisma().state.findMany();
    },
  },

  State: {
    demonstrations: async (parent: PrismaState) => {
      return await prisma().demonstration.findMany({
        where: { stateId: parent.id },
      });
    },
  },
};
