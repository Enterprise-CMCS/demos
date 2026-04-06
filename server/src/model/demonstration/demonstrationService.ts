import { Demonstration, Prisma } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

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
        },
      },
    },
  }) satisfies PermissionMap<Prisma.DemonstrationWhereInput>;

export type DemonstrationService = {
  get(where: Prisma.DemonstrationWhereUniqueInput): Promise<Demonstration | null>;
  getMany(where?: Prisma.DemonstrationWhereInput): Promise<Demonstration[]>;
};

export function createDemonstrationService(user: ContextUser): DemonstrationService {
  return {
    async get(where: Prisma.DemonstrationWhereUniqueInput): Promise<Demonstration | null> {
      return await prisma().demonstration.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where: Prisma.DemonstrationWhereInput = {}): Promise<Demonstration[]> {
      return await prisma().demonstration.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
