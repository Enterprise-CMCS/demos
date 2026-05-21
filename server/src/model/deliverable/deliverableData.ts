import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectDeliverable, selectManyDeliverables } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";
import { log } from "../../log";

export const isAStatePointOfContactAssociatedWithDeliverable = (
  userId: string
): Prisma.DeliverableWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All Deliverables": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Deliverables on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithDeliverable(userId),
  }) satisfies PermissionFilters<Prisma.DeliverableWhereInput>;

export async function getDeliverable(
  where: Prisma.DeliverableWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DeliverableWhereInput>(
    user,
    getPermissionFilters
  );


  if (authFilter !== null) {
    const authorizedDeliverable = await selectDeliverable(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedDeliverable) {
      return authorizedDeliverable;
    }
  }

  const deliverable = await selectDeliverable(where, tx);
  if (deliverable) {
    log.warn(
      `User ${user.id} attempted to access Deliverable ${deliverable.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Deliverable not found or User does not have Permission to view it.");
}

export async function getManyDeliverables(
  where: Prisma.DeliverableWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DeliverableWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDeliverables(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
