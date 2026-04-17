import { State as PrismaState } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { GraphQLContext } from "../../auth";
import { getManyDemonstrations } from "../demonstration";

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
