import { State as PrismaState } from "@prisma/client";
import { type GraphQLContext } from "../../auth";
import { getManyDemonstrations } from "../demonstration";
import { selectManyStates, selectStateOrThrow } from "./queries";

export const stateResolvers = {
  Query: {
    state: (parent: unknown, args: { id: string }): Promise<PrismaState> =>
      selectStateOrThrow({ id: args.id }),
    states: (): Promise<PrismaState[]> => selectManyStates({}),
  },

  State: {
    demonstrations: (parent: PrismaState, args: unknown, context: GraphQLContext) =>
      getManyDemonstrations({ stateId: parent.id }, context.user),
  },
};
