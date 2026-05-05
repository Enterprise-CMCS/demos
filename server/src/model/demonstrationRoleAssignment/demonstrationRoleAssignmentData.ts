import { Prisma } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import {
  type DemonstrationRoleAssignmentQueryResult,
  selectDemonstrationRoleAssignment,
  selectManyDemonstrationRoleAssignments,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All DemonstrationRoleAssignments": {
      NOT: {
        demonstrationId: {
          in: [],
        },
      },
    },
    "View DemonstrationRoleAssignments on Assigned Demonstrations": {
      demonstration: isStatePointOfContactOnDemonstration(userId),
    },
  }) satisfies PermissionFilters<Prisma.DemonstrationRoleAssignmentWhereInput>;

export async function getDemonstrationRoleAssignment(
  where: Prisma.DemonstrationRoleAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DemonstrationRoleAssignmentQueryResult | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationRoleAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectDemonstrationRoleAssignment(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyDemonstrationRoleAssignments(
  where: Prisma.DemonstrationRoleAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DemonstrationRoleAssignmentQueryResult[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationRoleAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDemonstrationRoleAssignments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
