import { User } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { CreateUserInput } from "./userSchema.js";
import type { GraphQLResolveInfo } from "graphql";
import type { GraphQLContext } from "../../auth/auth.util.js";

export const userResolvers = {
  Query: {
    user: async (_: undefined, { id }: { id: string }) => {
      return await prisma().user.findUnique({
        where: { id: id },
      });
    },
    users: async () => {
      return await prisma().user.findMany();
    },
    currentUser: async (
      _parent: unknown,
      _args: Record<string, never>,
      ctx: GraphQLContext,
      _info?: GraphQLResolveInfo
    ): Promise<PrismaUser | null> => {
      if (!ctx.user) return null;
      try {
        return await prisma().user.findUnique({ where: { id: ctx.user.id } });
      } catch (e) {
        console.error("[currentUser] resolver error:", e);
        throw e;
      }
    },
  },

  Mutation: {
    createUser: async (_: undefined, { input }: { input: CreateUserInput }) => {
      const { stateIds, roleIds, demonstrationIds, ...rest } = input;
      return await prisma().user.create({
        data: {
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
    },

    updateUser: async (
      _: undefined,
      { id, input }: { id: string; input: CreateUserInput },
    ) => {
      const { stateIds, roleIds, demonstrationIds, ...rest } = input;
      return await prisma().user.update({
        where: { id },
        data: {
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
      const userStateDemonstrations =
        await prisma().userStateDemonstration.findMany({
          where: { userId: parent.id },
          include: {
            demonstration: true,
          },
        });

      return userStateDemonstrations.map(
        (userStateDemonstration) => userStateDemonstration.demonstration,
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
