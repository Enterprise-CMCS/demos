import { State as PrismaState } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { getManyDemonstrations } from "../demonstration/demonstrationData.js";

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
    demonstrations: (parent: PrismaState, args: unknown, context: GraphQLContext) =>
      getManyDemonstrations({ stateId: parent.id }, context.user),
  },
};
