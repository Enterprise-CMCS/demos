import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { ContextUser } from "../../auth/auth.util.js";
import { buildAuthorizedWhere, PermissionMap } from "../../auth/services.js";

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
    "View Amendments on Assigned Demonstrations": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
            roleId: "State Point of Contact",
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.AmendmentWhereInput>;

export type AmendmentService = {
  get(where: Prisma.AmendmentWhereUniqueInput): Promise<PrismaAmendment | null>;
  getMany(where?: Prisma.AmendmentWhereInput): Promise<PrismaAmendment[]>;
};

export function createAmendmentService(user: ContextUser): AmendmentService {
  return {
    async get(where) {
      return await prisma().amendment.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().amendment.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
