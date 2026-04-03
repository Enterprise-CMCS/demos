import { Amendment, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.AmendmentWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Amendments": {
      NOT: alwaysFalseClause,
    },
    "View Assigned Amendments": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.AmendmentWhereInput>;

export type AmendmentService = {
  get(where: Prisma.AmendmentWhereUniqueInput): Promise<Amendment | null>;
  getMany(where?: Prisma.AmendmentWhereInput): Promise<Amendment[]>;
};

export function createAmendmentService(user: ContextUser): AmendmentService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where: Prisma.AmendmentWhereUniqueInput): Promise<Amendment | null> {
      return await prisma().amendment.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where: Prisma.AmendmentWhereInput = {}): Promise<Amendment[]> {
      return await prisma().amendment.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
