import { GraphQLContext } from "../../auth";
import { createEmail } from "./createEmail";
import { CreateEmailInput } from "./emailSchema";

export const emailResolvers = {
  Mutation: {
    createEmail: async (
      parent: unknown,
      args: { input: CreateEmailInput },
      context: GraphQLContext
    ): Promise<string> => createEmail(args.input, context),
  },
};
