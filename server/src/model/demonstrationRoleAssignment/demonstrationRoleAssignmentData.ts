import { Prisma } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import {
  type DemonstrationRoleAssignmentQueryResult,
  selectDemonstrationRoleAssignment,
  selectManyDemonstrationRoleAssignments,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";

export const isAStatePointOfContactAssociatedWithDemonstrationRoleAssignment = (
  userId: string
): Prisma.DemonstrationRoleAssignmentWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All DemonstrationRoleAssignments": {
      NOT: {
        demonstrationId: {
          in: [],
        },
      },
    },
    "View DemonstrationRoleAssignments on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithDemonstrationRoleAssignment(userId),
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
