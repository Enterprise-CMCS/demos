import { DemonstrationRoleAssignment, Prisma } from "@prisma/client";
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

type DemonstrationRoleAssignmentWithPrimary = DemonstrationRoleAssignment & {
  isPrimary: boolean;
};

export type DemonstrationRoleAssignmentService = {
  get(
    where: Prisma.DemonstrationRoleAssignmentWhereUniqueInput
  ): Promise<DemonstrationRoleAssignmentWithPrimary | null>;
  getMany(
    where?: Prisma.DemonstrationRoleAssignmentWhereInput
  ): Promise<DemonstrationRoleAssignmentWithPrimary[]>;
};

export function createDemonstrationRoleAssigmentService(
  user: ContextUser
): DemonstrationRoleAssignmentService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where) {
      const demonstrationRoleAssignment = await prisma().demonstrationRoleAssignment.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
        include: {
          primaryDemonstrationRoleAssignment: true,
        },
      });
      if (!demonstrationRoleAssignment) {
        return null;
      }
      return {
        ...demonstrationRoleAssignment,
        isPrimary: !!demonstrationRoleAssignment.primaryDemonstrationRoleAssignment,
      };
    },
    async getMany(where = {}) {
      const demonstrationRoleAssignments = await prisma().demonstrationRoleAssignment.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
        include: {
          primaryDemonstrationRoleAssignment: true,
        },
      });

      return demonstrationRoleAssignments.map((assignment) => ({
        ...assignment,
        isPrimary: !!assignment.primaryDemonstrationRoleAssignment,
      }));
    },
  };
}
