import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { ContextUser } from "../../auth/auth.util.js";
import { buildAuthorizedWhere, PermissionMap } from "../../auth/services.js";

const alwaysFalseClause: Prisma.DemonstrationWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Demonstrations": {
      NOT: alwaysFalseClause,
    },
    "View Assigned Demonstrations": {
      demonstrationRoleAssignments: {
        some: {
          personId: userId,
          roleId: "State Point of Contact",
        },
      },
    },
  }) satisfies PermissionMap<Prisma.DemonstrationWhereInput>;

export type DemonstrationService = {
  get(where: Prisma.DemonstrationWhereUniqueInput): Promise<PrismaDemonstration | null>;
  getMany(where?: Prisma.DemonstrationWhereInput): Promise<PrismaDemonstration[]>;
};

export function createDemonstrationService(user: ContextUser): DemonstrationService {
  return {
    async get(where) {
      return await prisma().demonstration.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().demonstration.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
