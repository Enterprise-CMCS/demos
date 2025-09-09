import { Role } from "@prisma/client";
import { prisma } from "../../prismaClient.js";

export const roleResolvers = {
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
  },
};
