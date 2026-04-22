import { Prisma } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import {
  type DeliverableDemonstrationTypeQueryResult,
  selectDeliverableDemonstrationType,
  selectManyDeliverableDemonstrationTypes,
} from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All DeliverableDemonstrationTypes": {
      NOT: {
        deliverableId: {
          in: [],
        },
      },
    },
    "View DeliverableDemonstrationTypes on Assigned Demonstrations": {
      deliverable: {
        demonstration: isStatePointOfContactOnDemonstration(userId),
      },
    },
  }) satisfies PermissionFilters<Prisma.DeliverableDemonstrationTypeWhereInput>;

export async function getDeliverableDemonstrationType(
  where: Prisma.DeliverableDemonstrationTypeWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DeliverableDemonstrationTypeQueryResult | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DeliverableDemonstrationTypeWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectDeliverableDemonstrationType(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyDeliverableDemonstrationTypes(
  where: Prisma.DeliverableDemonstrationTypeWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<DeliverableDemonstrationTypeQueryResult[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DeliverableDemonstrationTypeWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDeliverableDemonstrationTypes(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
