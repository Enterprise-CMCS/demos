import { User } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { AddUserInput } from "./userSchema.js";
import { requireRole } from "../../auth/auth.util.js";

export const userResolvers = {
  Query: {
    user: async (_: undefined, { id }: { id: string }) => {
      return await prisma().user.findUnique({
        where: { id: id },
      });
    },
    users: requireRole(["ADMIN"])(async () => {
      return await prisma().user.findMany();
    }),
  },

  Mutation: {
    addUser: async (_: undefined, { input }: { input: AddUserInput }) => {
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
      { id, input }: { id: string; input: AddUserInput },
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
          userId: parent.id
        }
      });
    }
  },
};
