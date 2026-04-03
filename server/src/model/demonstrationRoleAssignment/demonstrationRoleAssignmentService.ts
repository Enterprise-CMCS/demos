import { Demonstration, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.DemonstrationRoleAssignmentWhereInput = {
  demonstrationId: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Demonstration Role Assignments": {
      NOT: alwaysFalseClause,
    },
    "View My Demonstration Role Assignments": {
      personId: userId,
    },
  }) satisfies PermissionMap<Prisma.DemonstrationRoleAssignmentWhereInput>;

export type DemonstrationService = {
  get(where: Prisma.DemonstrationWhereUniqueInput): Promise<Demonstration | null>;
  getMany(where?: Prisma.DemonstrationWhereInput): Promise<Demonstration[]>;
};

export function createDemonstrationService(user: ContextUser): DemonstrationService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

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
