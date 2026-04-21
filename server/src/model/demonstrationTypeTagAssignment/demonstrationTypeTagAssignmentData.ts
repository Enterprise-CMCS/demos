import { Prisma } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import {
  type DemonstrationTypeTagAssignmentQueryResult,
  selectDemonstrationTypeTagAssignment,
  selectManyDemonstrationTypeTagAssignments,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All DemonstrationTypeTagAssignments": {
      NOT: {
        demonstrationId: {
          in: [],
        },
      },
    },
    "View DemonstrationTypeTagAssignments on Assigned Demonstrations": {
      demonstration: isStatePointOfContactOnDemonstration(userId),
    },
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
