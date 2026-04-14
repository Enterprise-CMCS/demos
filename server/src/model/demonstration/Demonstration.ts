import { Prisma, Demonstration as PrismaDemonstration } from "@prisma/client";
import { ContextUser } from "../../auth/auth.util.js";
import {
  buildAuthorizationFilter,
  PermissionFilters,
} from "../../auth/buildAuthorizationFilter.js";
import { queryDemonstration } from "./queries/queryDemonstration.js";
import { queryManyDemonstrations } from "./queries/queryManyDemonstrations.js";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Demonstrations": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Assigned Demonstrations": {
      demonstrationRoleAssignments: {
        some: {
          personId: userId,
          roleId: "State Point of Contact",
        },
      },
    },
  }) satisfies PermissionFilters<Prisma.DemonstrationWhereInput>;

export async function getDemonstration(
  where: Prisma.DemonstrationWhereInput,
  user: ContextUser
): Promise<PrismaDemonstration | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await queryDemonstration({
    AND: [where, authFilter],
  });
}

export async function getManyDemonstrations(
  where: Prisma.DemonstrationWhereInput,
  user: ContextUser
): Promise<PrismaDemonstration[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await queryManyDemonstrations({
    AND: [where, authFilter],
  });
}
