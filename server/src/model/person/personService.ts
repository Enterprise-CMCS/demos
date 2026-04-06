import { Person, Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.PersonWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = (userId: string) =>
  ({
    "View All People": {
      NOT: alwaysFalseClause,
    },
    "View Me": {
      id: userId,
    },
    "View People on My Demonstrations": {
      demonstrationRoleAssignments: {
        some: {
          demonstration: {
            demonstrationRoleAssignments: {
              some: {
                personId: userId,
              },
            },
          },
        },
      },
    },
  }) satisfies PermissionMap<Prisma.PersonWhereInput>;

export type PersonService = {
  get(where: Prisma.PersonWhereUniqueInput): Promise<Person | null>;
  getMany(where?: Prisma.PersonWhereInput): Promise<Person[]>;
};

export function createPersonService(user: ContextUser): PersonService {
  if (!user) {
    throw new GraphQLError("User not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    async get(where) {
      return await prisma().person.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().person.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
