import { GraphQLContext } from "../../auth";
import { testEmail } from "./testEmail";
import { TestEmailInput } from "./emailSchema";

export const emailResolvers = {
  Mutation: {
    testEmail: async (
      parent: unknown,
      args: { input: TestEmailInput },
      context: GraphQLContext
    ): Promise<string> => testEmail(args.input, context),
  },
};
