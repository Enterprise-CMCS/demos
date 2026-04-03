import { Extension, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

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
    "View Assigned Extensions": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.ExtensionWhereInput>;

export type ExtensionService = {
  get(where: Prisma.ExtensionWhereUniqueInput): Promise<Extension | null>;
  getMany(where?: Prisma.ExtensionWhereInput): Promise<Extension[]>;
};

export function createExtensionService(user: ContextUser): ExtensionService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where: Prisma.ExtensionWhereUniqueInput): Promise<Extension | null> {
      return await prisma().extension.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where: Prisma.ExtensionWhereInput = {}): Promise<Extension[]> {
      return await prisma().extension.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
