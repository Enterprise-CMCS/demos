import { Permission } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { AddPermissionInput, UpdatePermissionInput } from "./permissionSchema.js";

export const permissionResolvers = {
  Query: {
    permission: async (_: undefined, { id }: { id: string }) => {
      return await prisma().permission.findUnique({
        where: { id: id },
      });
    },
    permissions: async () => {
      return await prisma().permission.findMany();
    },
  },

  Mutation: {
    addPermission: async (
      _: undefined,
      { input }: { input: AddPermissionInput },
    ) => {
      return await prisma().permission.create({
        data: {
          ...input,
          rolePermissions: {
            create: input.roleIds?.map((roleId: string) => ({
              roleId,
            })),
          },
        },
      });
    },

    updatePermission: async (
      _: undefined,
      { id, input }: { id: string; input: UpdatePermissionInput },
    ) => {
      return await prisma().permission.update({
        where: { id },
        data: {
          ...input,
          ...(input.roleIds && {
            create: input.roleIds.map((roleId: string) => ({
              roleId,
            })),
          }),
        },
      });
    },

    deletePermission: async (_: undefined, { id }: { id: string }) => {
      return await prisma().permission.delete({
        where: { id: id },
      });
    },
  },

  Permission: {
    roles: async (parent: Permission) => {
      const rolePermissions = await prisma().rolePermission.findMany({
        where: { permissionId: parent.id },
        include: {
          role: true,
        },
      });
      return rolePermissions.map((rolePermission) => rolePermission.role);
    },
  },
};
