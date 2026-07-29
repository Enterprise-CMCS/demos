import { GraphQLContext } from "../../auth";
import { createTestEmail } from "./createTestEmail";
import { CreateTestEmailInput } from "./emailSchema";

export const emailResolvers = {
  Mutation: {
    createTestEmail: async (
      parent: unknown,
      args: { input: CreateTestEmailInput },
      context: GraphQLContext
    ): Promise<string> => createTestEmail(args.input, context),
  },
};
