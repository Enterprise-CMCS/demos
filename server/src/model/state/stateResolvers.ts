import { State as PrismaState } from "@prisma/client";
import { type GraphQLContext } from "../../auth";
import { getManyDemonstrations } from "../demonstration";
import { getManyStates, getState } from "./stateData";

export const stateResolvers = {
  Query: {
    state: (parent: unknown, args: { id: string }) => getState({ id: args.id }),
    states: () => getManyStates({}),
  },

  State: {
    demonstrations: (parent: PrismaState, args: unknown, context: GraphQLContext) =>
      getManyDemonstrations({ stateId: parent.id }, context.user),
  },
};
