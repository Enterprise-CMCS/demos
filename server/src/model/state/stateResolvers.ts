import { Demonstration, Prisma, State } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

export async function getState(
  parent: Demonstration,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<State | null> {
  const parentType = info.parentType.name;
  let filter: Prisma.StateWhereUniqueInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { id: (parent as Extract<typeof parent, Demonstration>).stateId };
      break;

    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().state.findUnique({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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
    demonstrations: async (parent: State) => {
      return await prisma().demonstration.findMany({
        where: { stateId: parent.id },
      });
    },
  },
};
