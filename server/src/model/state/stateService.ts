import { Prisma, State } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.StateWhereInput = {
  id: {
    in: [],
  },
};

const permissionMapper = () =>
  ({
    "View All States": {
      NOT: alwaysFalseClause,
    },
  }) satisfies PermissionMap<Prisma.StateWhereInput>;

export type StateService = {
  get(where: Prisma.StateWhereUniqueInput): Promise<State | null>;
  getMany(where?: Prisma.StateWhereInput): Promise<State[]>;
};

export function createStateService(user: ContextUser): StateService {
  return {
    async get(where) {
      return await prisma().state.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().state.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
