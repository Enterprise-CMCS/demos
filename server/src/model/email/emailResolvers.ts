import { createTestEmail } from "./createTestEmail";

export const emailResolvers = {
  Mutation: {
    createTestEmail: async (
      parent: unknown,
      args: { recipientEmail: string }
    ): Promise<string> => createTestEmail(args.recipientEmail),
  },
};
