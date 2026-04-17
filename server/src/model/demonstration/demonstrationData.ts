import { Prisma, Demonstration as PrismaDemonstration } from "@prisma/client";
import { selectDemonstration, selectManyDemonstrations } from "./queries";
import {
  ContextUser,
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
} from "../../auth";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Demonstrations": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Assigned Demonstrations": isStatePointOfContactOnDemonstration(userId),
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

  return await selectDemonstration({
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
  return await selectManyDemonstrations({
    AND: [where, authFilter],
  });
}
