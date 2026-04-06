import { Document, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.DocumentWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Documents": {
      NOT: alwaysFalseClause,
    },
    "View My Documents": {
      ownerUserId: userId,
    },
    "View Documents for My Demonstrations": {
      application: {
        demonstration: {
          demonstrationRoleAssignments: {
            some: {
              personId: userId,
            },
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.DocumentWhereInput>;

export type DocumentService = {
  get(where: Prisma.DocumentWhereUniqueInput): Promise<Document | null>;
  getMany(where?: Prisma.DocumentWhereInput): Promise<Document[]>;
};

export function createDocumentService(user: ContextUser): DocumentService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where) {
      return await prisma().document.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().document.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
