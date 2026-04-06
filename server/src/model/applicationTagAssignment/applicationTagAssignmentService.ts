import { ApplicationTagAssignment, Prisma, Tag } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.ApplicationTagAssignmentWhereInput = {
  applicationId: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Application Tag Assignments": {
      NOT: alwaysFalseClause,
    },
    "View Application Tag Assignments on Assigned Demonstrations": {
      application: {
        OR: [
          {
            extension: {
              demonstration: {
                demonstrationRoleAssignments: {
                  some: {
                    personId: userId,
                  },
                },
              },
            },
          },
          {
            amendment: {
              demonstration: {
                demonstrationRoleAssignments: {
                  some: {
                    personId: userId,
                  },
                },
              },
            },
          },
          {
            demonstration: {
              demonstrationRoleAssignments: {
                some: {
                  personId: userId,
                },
              },
            },
          },
        ],
      },
    },
  }) satisfies PermissionMap<Prisma.ApplicationTagAssignmentWhereInput>;

export type tagAssignmentWithTag = ApplicationTagAssignment & {
  tag: Tag;
};

export type ApplicationTagAssignmentService = {
  get(where: Prisma.ApplicationTagAssignmentWhereUniqueInput): Promise<tagAssignmentWithTag | null>;
  getMany(where?: Prisma.ApplicationTagAssignmentWhereInput): Promise<tagAssignmentWithTag[]>;
};

export function createApplicationTagAssignmentService(
  user: ContextUser
): ApplicationTagAssignmentService {
  return {
    async get(where) {
      return await prisma().applicationTagAssignment.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
        include: {
          tag: true,
        },
      });
    },
    async getMany(where = {}) {
      return await prisma().applicationTagAssignment.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
        include: {
          tag: true,
        },
      });
    },
  };
}
