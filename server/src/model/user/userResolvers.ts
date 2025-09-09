import { User } from "@prisma/client";
import type { Person, User as PrismaUser } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { CreateUserInput, UpdateUserInput } from "./userSchema.js";
import type { GraphQLContext } from "../../auth/auth.util.js";

export function resolveUser(user: User & { person: Person }) {
  return {
    ...user,
    ...user.person,
  };
}

export const userResolvers = {
  Query: {
    user: async (_: undefined, { id }: { id: string }) => {
      const user = await prisma().user.findUnique({
        where: { id: id },
        include: {
          person: true,
        },
      });
      return { ...user, ...user?.person };
    },
    users: async () => {
      return (await prisma().user.findMany({ include: { person: true } })).map(resolveUser);
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
        stateIds,
        roleIds,
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
          ...(stateIds && {
            userStates: {
              create: stateIds.map((stateId: string) => ({ stateId })),
            },
          }),
          ...(roleIds && {
            userRoles: {
              create: roleIds.map((roleId: string) => ({ roleId })),
            },
          }),
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
      const {
        fullName,
        displayName,
        email,
        username,
        personTypeId,
        stateIds,
        roleIds,
        demonstrationIds,
        ...rest
      } = input;
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
          ...(stateIds && {
            userStates: {
              create: stateIds.map((stateId: string) => ({ stateId })),
            },
          }),
          ...(roleIds && {
            userRoles: {
              create: roleIds.map((roleId: string) => ({ roleId })),
            },
          }),
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
    states: async (parent: User) => {
      const userStates = await prisma().userState.findMany({
        where: { userId: parent.id },
        include: {
          state: true,
        },
      });
      return userStates.map((userState) => userState.state);
    },
    roles: async (parent: User) => {
      const userRoles = await prisma().userRole.findMany({
        where: { userId: parent.id },
        include: {
          role: true,
        },
      });
      return userRoles.map((userRole) => userRole.role);
    },

    demonstrations: async (parent: User) => {
      const userStateDemonstrations = await prisma().userStateDemonstration.findMany({
        where: { userId: parent.id },
        include: {
          demonstration: true,
        },
      });

      return userStateDemonstrations.map(
        (userStateDemonstration) => userStateDemonstration.demonstration
      );
    },

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
