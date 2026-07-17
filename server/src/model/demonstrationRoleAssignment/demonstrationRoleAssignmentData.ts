import {
  Prisma,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
} from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";

import { PrismaTransactionClient } from "../../prismaClient";
import { selectManyDemonstrationRoleAssignments } from "./queries";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";

const getPermissionFilters = (userId: string) =>
  ({
    "View All DemonstrationRoleAssignments": {
      NOT: {
        personId: {
          in: [],
        },
      },
    },
    "View DemonstrationRoleAssignments on Assigned Demonstrations": {
      demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
    },
  }) satisfies PermissionFilters<Prisma.DemonstrationRoleAssignmentWhereInput>;

export async function getManyDemonstrationRoleAssignments(
  where: Prisma.DemonstrationRoleAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstrationRoleAssignment[]> {
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
