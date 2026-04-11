import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import { ContextUser } from "../../auth/auth.util.js";
import {
  buildAuthorizationFilter,
  PermissionFilters,
} from "../../auth/buildAuthorizationFilter.js";
import { queryExtension } from "./queries/queryExtension.js";
import { queryManyExtensions } from "./queries/queryManyExtensions.js";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Extensions": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Extensions on Assigned Demonstrations": {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: userId,
            roleId: "State Point of Contact",
          },
        },
      },
    },
  }) satisfies PermissionFilters<Prisma.ExtensionWhereInput>;

export async function getExtension(
  where: Prisma.ExtensionWhereInput,
  user: ContextUser
): Promise<PrismaExtension | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ExtensionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }
  return queryExtension({
    AND: [where, authFilter],
  });
}

export async function getManyExtensions(
  where: Prisma.ExtensionWhereInput,
  user: ContextUser
): Promise<PrismaExtension[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ExtensionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return queryManyExtensions({
    AND: [where, authFilter],
  });
}
