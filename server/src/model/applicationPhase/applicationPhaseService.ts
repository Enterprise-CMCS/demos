import { ApplicationPhase, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.ApplicationPhaseWhereInput = {
  applicationId: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All Application Phases": {
      NOT: alwaysFalseClause,
    },
    "View Application Phases on Assigned Demonstrations": {
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
  }) satisfies PermissionMap<Prisma.ApplicationPhaseWhereInput>;

export type ApplicationPhaseService = {
  get(where: Prisma.ApplicationPhaseWhereUniqueInput): Promise<ApplicationPhase | null>;
  getMany(where?: Prisma.ApplicationPhaseWhereInput): Promise<ApplicationPhase[]>;
};

export function createApplicationPhaseService(user: ContextUser): ApplicationPhaseService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where) {
      return await prisma().applicationPhase.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().applicationPhase.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
