import { prisma } from "../../prismaClient.js";
import type { GraphQLContext } from "../../auth/auth.util.js";
import { User as PrismaUser } from "@prisma/client";
import { log } from "../../log.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

export async function getUser(id: string): Promise<PrismaUser> {
  try {
    return await prisma().user.findUniqueOrThrow({
      where: { id: id },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const userResolvers = {
  Query: {
    currentUser: async (
      _parent: unknown,
      _args: Record<string, never>,
      ctx: GraphQLContext
    ): Promise<PrismaUser | null> => {
      if (!ctx.user) return null;
      try {
        return await prisma().user.findUnique({
          where: { id: ctx.user.id },
        });
      } catch (err) {
        log.error({ err }, "[currentUser] resolver error");
        throw err;
      }
    },
  },

  User: {
    person: async (parent: PrismaUser) => {
      return await prisma().person.findUnique({
        where: {
          id: parent.id,
        },
      });
    },
    events: async (parent: PrismaUser) => {
      return await prisma().event.findMany({
        where: {
          userId: parent.id,
        },
      });
    },
    ownedDocuments: async (parent: PrismaUser) => {
      return await prisma().document.findMany({
        where: {
          ownerUserId: parent.id,
        },
      });
    },
  },
};
