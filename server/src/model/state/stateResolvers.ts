import { GraphQLContext } from "../../auth/auth.util.js";

export const stateResolvers = {
  Query: {
    state: (parent: never, args: { id: string }, context: GraphQLContext) =>
      context.services.state.get({ id: args.id }),
    states: (parent: never, args: never, context: GraphQLContext) =>
      context.services.state.getMany(),
  },

  State: {
    demonstrations: (parent: { demonstrationId: string }, args: never, context: GraphQLContext) =>
      context.services.demonstration.getMany({ id: parent.demonstrationId }),
  },
};
