import { Prisma } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import {
  type ApplicationTagAssignmentQueryResult,
  selectApplicationTagAssignment,
  selectManyApplicationTagAssignments,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";

const isAStatePointOfContactAssociatedWithApplicationTagAssignment = (
  userId: string
): Prisma.ApplicationTagAssignmentWhereInput => ({
  application: isAStatePointOfContactAssociatedWithApplication(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All ApplicationTagAssignments": {
      NOT: {
        applicationId: {
          in: [],
        },
      },
    },
    "View ApplicationTagAssignments on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithApplicationTagAssignment(userId),
  }) satisfies PermissionFilters<Prisma.ApplicationTagAssignmentWhereInput>;

export async function getApplicationTagAssignment(
  where: Prisma.ApplicationTagAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<ApplicationTagAssignmentQueryResult | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationTagAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectApplicationTagAssignment(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyApplicationTagAssignments(
  where: Prisma.ApplicationTagAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<ApplicationTagAssignmentQueryResult[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationTagAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyApplicationTagAssignments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
