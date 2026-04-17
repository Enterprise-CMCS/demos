import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import {
  buildAuthorizationFilter,
  PermissionFilters,
} from "../../auth/buildAuthorizationFilter.js";
import { selectExtension } from "./queries/selectExtension.js";
import { selectManyExtensions } from "./queries/selectManyExtensions.js";
import { ContextUser } from "../../auth/userContext.js";

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

  return await selectExtension({
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
  return await selectManyExtensions({
    AND: [where, authFilter],
  });
}
