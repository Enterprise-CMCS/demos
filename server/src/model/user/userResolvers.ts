import { User } from "@prisma/client";
import type { Person, User as PrismaUser } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { CreateUserInput, UpdateUserInput } from "./userSchema.js";
import type { GraphQLContext } from "../../auth/auth.util.js";

function resolveUser(user: (User & { person: Person }) | null): PrismaUser | null {
  if (!user) return null;
  return {
    ...user,
    ...user.person,
  };
}

export async function findUniqueUser(id: string): Promise<PrismaUser | null> {
  const user = await prisma().user.findUnique({
    where: { id: id },
    include: {
      person: true,
    },
  });

  return resolveUser(user);
}

export async function findManyUsers(where?: Record<string, string>): Promise<PrismaUser[]> {
  const users = await prisma().user.findMany({
    where,
    include: {
      person: true,
    },
  });

  return users.map(resolveUser).filter((user): user is PrismaUser => user !== null);
}

export const userResolvers = {
  Query: {
    user: async (_: undefined, { id }: { id: string }) => {
      return findUniqueUser(id);
    },
    users: async () => {
      return findManyUsers();
    },
    currentUser: async (
      _parent: unknown,
      _args: Record<string, never>,
      ctx: GraphQLContext
    ): Promise<PrismaUser | null> => {
      if (!ctx.user) return null;
      try {
        const user = await prisma().user.findUnique({
          where: { id: ctx.user.id },
          include: { person: true },
        });
        if (!user) return null;
        return resolveUser(user);
      } catch (e) {
        console.error("[currentUser] resolver error:", e);
        throw e;
      }
    },
  },

  Mutation: {
    createUser: async (_: undefined, { input }: { input: CreateUserInput }) => {
      const {
        email,
        username,
        cognitoSubject,
        personTypeId,
        demonstrationIds,
        fullName,
        displayName,
        ...rest
      } = input;
      const person = await prisma().person.create({
        data: {
          ...rest,
          displayName: displayName,
          fullName: fullName,
          email: email,
          personTypeId,
        },
      });
      const user = await prisma().user.create({
        data: {
          username: username,
          cognitoSubject: cognitoSubject,
          id: person.id,
          personTypeId: person.personTypeId,
          ...rest,
          ...(demonstrationIds && {
            userStateDemonstrations: {
              create: (
                await prisma().demonstration.findMany({
                  where: { id: { in: demonstrationIds } },
                  select: { id: true, stateId: true },
                })
              ).map((demonstration) => ({
                stateId: demonstration.stateId,
                demonstrationId: demonstration.id,
              })),
            },
          }),
        },
      });
      return { ...user, ...person };
    },

    updateUser: async (_: undefined, { id, input }: { id: string; input: UpdateUserInput }) => {
      const { fullName, displayName, email, username, personTypeId, demonstrationIds, ...rest } =
        input;
      const person = await prisma().person.update({
        where: { id },
        data: {
          ...rest,
          displayName: displayName,
          fullName: fullName,
          email: email,
          personTypeId,
        },
      });
      const user = await prisma().user.update({
        where: { id },
        data: {
          ...rest,
          username: username,
          ...(demonstrationIds && {
            userStateDemonstrations: {
              create: (
                await prisma().demonstration.findMany({
                  where: { id: { in: demonstrationIds } },
                  select: { id: true, stateId: true },
                })
              ).map((demonstration) => ({
                stateId: demonstration.stateId,
                demonstrationId: demonstration.id,
              })),
            },
          }),
        },
      });
      return { ...user, ...person };
    },

    deleteUser: async (_: undefined, { id }: { id: string }) => {
      return await prisma().user.delete({
        where: { id: id },
      });
    },
  },

  User: {
    events: async (parent: User) => {
      return await prisma().event.findMany({
        where: {
          userId: parent.id,
        },
      });
    },

    ownedDocuments: async (parent: User) => {
      return await prisma().document.findMany({
        where: {
          ownerUserId: parent.id,
        },
      });
    },
  },
};
