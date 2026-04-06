import { Prisma, Tag } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { buildAuthorizedWhere, ContextUser, PermissionMap } from "../../auth/auth.util.js";

const alwaysFalseClause: Prisma.TagWhereInput = {
  tagNameId: {
    in: [],
  },
};

const permissionMapper = () =>
  ({
    "View All Tags": {
      NOT: alwaysFalseClause,
    },
  }) satisfies PermissionMap<Prisma.TagWhereInput>;

export type TagService = {
  get(where: Prisma.TagWhereUniqueInput): Promise<Tag | null>;
  getMany(where?: Prisma.TagWhereInput): Promise<Tag[]>;
};

export function createTagService(user: ContextUser): TagService {
  return {
    async get(where) {
      return await prisma().tag.findFirst({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
    async getMany(where = {}) {
      return await prisma().tag.findMany({
        where: buildAuthorizedWhere(user, where, alwaysFalseClause, permissionMapper),
      });
    },
  };
}
