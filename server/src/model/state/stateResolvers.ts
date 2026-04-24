import { State as PrismaState } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { getManyDemonstrations } from "../demonstration/demonstrationData.js";
import { getManyStates, getState } from "./stateData.js";

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
