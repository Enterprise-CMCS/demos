import { DemonstrationTypeTagAssignment, Prisma, Tag } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";
import { determineDemonstrationTypeStatus } from "../demonstration/determineDemonstrationTypeStatus.js";

const alwaysFalseClause: Prisma.DemonstrationTypeTagAssignmentWhereInput = {
  demonstrationId: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Demonstration Type Tag Assignments": {
      NOT: alwaysFalseClause,
    },
    "View Demonstration Type Tag Assignments on Assigned Demonstrations": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.DemonstrationTypeTagAssignmentWhereInput>;

type DemonstrationTypeTagAssignmentWithTag = DemonstrationTypeTagAssignment & {
  tag: Tag;
};

export type DemonstrationTypeTagAssignmentService = {
  get(
    where: Prisma.DemonstrationTypeTagAssignmentWhereUniqueInput
  ): Promise<DemonstrationTypeTagAssignmentWithTag | null>;
  getMany(
    where?: Prisma.DemonstrationTypeTagAssignmentWhereInput
  ): Promise<DemonstrationTypeTagAssignmentWithTag[]>;
};

export function createDemonstrationTypeTagAssignmentService(
  user: ContextUser
): DemonstrationTypeTagAssignmentService {
  return {
    async get(where) {
      const demonstrationTypeTagAssignment =
        await prisma().demonstrationTypeTagAssignment.findFirst({
          where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
          include: {
            tag: true,
          },
        });
      if (!demonstrationTypeTagAssignment) {
        return null;
      }
      return {
        ...demonstrationTypeTagAssignment,
        status: determineDemonstrationTypeStatus(
          demonstrationTypeTagAssignment.effectiveDate,
          demonstrationTypeTagAssignment.expirationDate
        ),
        demonstrationTypeName: demonstrationTypeTagAssignment.tagNameId,
        approvalStatus: demonstrationTypeTagAssignment.tag.statusId,
      };
    },
    async getMany(where = {}) {
      const demonstrationTypeTagAssignments =
        await prisma().demonstrationTypeTagAssignment.findMany({
          where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
          include: {
            tag: true,
          },
        });
      return demonstrationTypeTagAssignments.map((assignment) => ({
        ...assignment,
        status: determineDemonstrationTypeStatus(
          assignment.effectiveDate,
          assignment.expirationDate
        ),
        demonstrationTypeName: assignment.tagNameId,
        approvalStatus: assignment.tag.statusId,
      }));
    },
  };
}
