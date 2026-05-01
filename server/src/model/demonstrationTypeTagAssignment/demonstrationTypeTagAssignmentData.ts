import { Prisma } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import {
  type DemonstrationTypeTagAssignmentQueryResult,
  selectDemonstrationTypeTagAssignment,
  selectManyDemonstrationTypeTagAssignments,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";

export const isAStatePointOfContactAssociatedWithDemonstrationTypeTagAssignment = (
  userId: string
): Prisma.DemonstrationTypeTagAssignmentWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All DemonstrationTypeTagAssignments": {
      NOT: {
        demonstrationId: {
          in: [],
        },
      },
    },
    "View DemonstrationTypeTagAssignments on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithDemonstrationTypeTagAssignment(userId),
  }) satisfies PermissionFilters<Prisma.DemonstrationTypeTagAssignmentWhereInput>;

export async function getDemonstrationTypeTagAssignment(
  where: Prisma.DemonstrationTypeTagAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DemonstrationTypeTagAssignmentQueryResult | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationTypeTagAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectDemonstrationTypeTagAssignment(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyDemonstrationTypeTagAssignments(
  where: Prisma.DemonstrationTypeTagAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DemonstrationTypeTagAssignmentQueryResult[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DemonstrationTypeTagAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDemonstrationTypeTagAssignments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
