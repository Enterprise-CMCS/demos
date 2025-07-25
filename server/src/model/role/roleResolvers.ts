import { Role } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { AddRoleInput, UpdateRoleInput } from "./roleSchema.js";

export const roleResolvers = {
  Query: {
    role: async (_: undefined, { id }: { id: string }) => {
      return await prisma().role.findUnique({
        where: { id: id },
      });
    },
    roles: async () => {
      return await prisma().role.findMany();
    },
  },

  Mutation: {
    addRole: async (_: undefined, { input }: { input: AddRoleInput }) => {
      const { userIds, permissionIds, ...rest } = input;
      return await prisma().role.create({
        data: {
          ...rest,
          ...(userIds && {
            userRoles: {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            },
          }),
          ...(permissionIds && {
            rolePermissions: {
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            },
          }),
        },
      });
    },

    updateRole: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateRoleInput },
    ) => {
      const { userIds, permissionIds, ...rest } = input;
      return await prisma().role.update({
        where: { id },
        data: {
          ...rest,
          ...(userIds && {
            userStates: {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            },
          }),
          ...(permissionIds && {
            rolePermissions: {
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            },
          }),
        },
      });
    },
  },

  Role: {
    permissions: async (parent: Role) => {
      const rolePermissions = await prisma().rolePermission.findMany({
        where: { roleId: parent.id },
        include: {
          permission: true,
        },
      });
      return rolePermissions.map((rolePermission) => rolePermission.permission);
    },
    users: async (parent: Role) => {
      const userRoles = await prisma().userRole.findMany({
        where: { roleId: parent.id },
        include: {
          user: true,
        },
      });
      return userRoles.map((userRole) => userRole.user);
    },
  },
};
