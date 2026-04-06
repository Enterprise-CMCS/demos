import { prisma } from "../../prismaClient.js";
import { GraphQLContext } from "../../auth/auth.util.js";

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
    demonstrations: (parent: { id: string }, args: never, context: GraphQLContext) =>
      context.services.demonstration.getMany({ stateId: parent.id }),
  },
};
