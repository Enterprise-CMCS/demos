import { prisma } from "../../prismaClient.js";
import type { GraphQLContext } from "../../auth/auth.util.js";
import { User } from "@prisma/client";

export const userResolvers = {
  Query: {
    currentUser: async (
      _parent: unknown,
      _args: Record<string, never>,
      ctx: GraphQLContext
    ): Promise<User | null> => {
      if (!ctx.user) return null;
      try {
        return await prisma().user.findUnique({
          where: { id: ctx.user.id },
        });
      } catch (e) {
        console.error("[currentUser] resolver error:", e);
        throw e;
      }
    },
  },

  User: {
    person: async (parent: User) => {
      return await prisma().person.findUnique({
        where: {
          id: parent.id,
        },
      });
    },
  },
};
