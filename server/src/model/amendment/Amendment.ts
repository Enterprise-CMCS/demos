import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { ContextUser } from "../../auth/auth.util.js";
import {
  buildAuthorizationFilter,
  PermissionFilters,
} from "../../auth/buildAuthorizationFilter.js";
import { queryAmendment } from "./queries/queryAmendment.js";
import { queryManyAmendments } from "./queries/queryManyAmendments.js";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Amendments": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Amendments on Assigned Demonstrations": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
            roleId: "State Point of Contact",
          },
        },
      },
    },
  }) satisfies PermissionFilters<Prisma.AmendmentWhereInput>;

export async function getAmendment(
  where: Prisma.AmendmentWhereInput,
  user: ContextUser
): Promise<PrismaAmendment | null> {
  const authFilter = buildAuthorizationFilter<Prisma.AmendmentWhereInput>(user, getPermissionFilters);

  if (authFilter === null) {
    return null;
  }
  return queryAmendment({
    AND: [where, authFilter],
  });
}

export async function getManyAmendments(
  where: Prisma.AmendmentWhereInput,
  user: ContextUser
): Promise<PrismaAmendment[]> {
  const authFilter = buildAuthorizationFilter<Prisma.AmendmentWhereInput>(user, getPermissionFilters);

  if (authFilter === null) {
    return [];
  }
  return queryManyAmendments({
    AND: [where, authFilter],
  });
}
