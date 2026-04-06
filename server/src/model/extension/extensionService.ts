import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { ContextUser } from "../../auth/auth.util.js";
import { buildAuthorizedWhere, PermissionMap } from "../../auth/services.js";

const alwaysFalseClause: Prisma.ExtensionWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Extensions": {
      NOT: alwaysFalseClause,
    },
    "View Extensions on Assigned Demonstrations": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
            roleId: "State Point of Contact",
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.ExtensionWhereInput>;

export type ExtensionService = {
  get(where: Prisma.ExtensionWhereUniqueInput): Promise<PrismaExtension | null>;
  getMany(where?: Prisma.ExtensionWhereInput): Promise<PrismaExtension[]>;
};

export function createExtensionService(user: ContextUser): ExtensionService {
  return {
    async get(where) {
      return await prisma().extension.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().extension.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
