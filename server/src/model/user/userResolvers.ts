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
      return await findUniqueUser(id);
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
        return await findUniqueUser(ctx.user.id);
      } catch (e) {
        console.error("[currentUser] resolver error:", e);
        throw e;
      }
    },
  },

  Mutation: {
    createUser: async (_: undefined, { input }: { input: CreateUserInput }) => {
      const { email, username, cognitoSubject, personTypeId, fullName, displayName } = input;
      const person = await prisma().person.create({
        data: {
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
        },
      });
      return { ...user, ...person };
    },

    updateUser: async (_: undefined, { id, input }: { id: string; input: UpdateUserInput }) => {
      const { fullName, displayName, email, username, personTypeId } = input;
      const person = await prisma().person.update({
        where: { id },
        data: {
          displayName: displayName,
          fullName: fullName,
          email: email,
          personTypeId,
        },
      });
      const user = await prisma().user.update({
        where: { id },
        data: {
          username: username,
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
    roles: async (parent: User) => {
      const assignments = await prisma().systemRoleAssignment.findMany({
        where: { personId: parent.id },
        include: { role: true },
      });
      return assignments.map((a) => a.role);
    },
  },
};
