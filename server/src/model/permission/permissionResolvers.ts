import { Permission } from "@prisma/client";
import { prisma } from "../../prismaClient.js";

export const permissionResolvers = {
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
