import { Prisma, Demonstration as PrismaDemonstration } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectDemonstration, selectManyDemonstrations } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

export const isAStatePointOfContactAssociatedWithDemonstration = (
  userId: string
): Prisma.DemonstrationWhereInput => ({
  demonstrationRoleAssignments: {
    some: {
      personId: userId,
      roleId: "State Point of Contact",
    },
  },
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All Demonstrations": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Assigned Demonstrations": isAStatePointOfContactAssociatedWithDemonstration(userId),
  }) satisfies PermissionFilters<Prisma.DemonstrationWhereInput>;

export async function getDemonstration(
  where: Prisma.DemonstrationWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectDemonstration(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyDemonstrations(
  where: Prisma.DemonstrationWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDemonstrations(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
