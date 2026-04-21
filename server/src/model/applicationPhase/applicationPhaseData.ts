import { Prisma, ApplicationPhase as PrismaApplicationPhase } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectApplicationPhase, selectManyApplicationPhases } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All ApplicationPhases": {
      NOT: {
        applicationId: {
          in: [],
        },
      },
    },
    "View ApplicationPhases on Assigned Demonstrations": {
      application: {
        OR: [
          {
            demonstration: isStatePointOfContactOnDemonstration(userId),
          },
          {
            amendment: {
              demonstration: isStatePointOfContactOnDemonstration(userId),
            },
          },
          {
            extension: {
              demonstration: isStatePointOfContactOnDemonstration(userId),
            },
          },
        ],
      },
    },
  }) satisfies PermissionFilters<Prisma.ApplicationPhaseWhereInput>;

export async function getApplicationPhase(
  where: Prisma.ApplicationPhaseWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationPhase | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationPhaseWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectApplicationPhase(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyApplicationPhases(
  where: Prisma.ApplicationPhaseWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationPhase[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationPhaseWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyApplicationPhases(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
