import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectAmendment, selectManyAmendments } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";
import { log } from "../../log";

export const isAStatePointOfContactAssociatedWithAmendment = (
  userId: string
): Prisma.AmendmentWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All Amendments": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Amendments on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithAmendment(userId),
  }) satisfies PermissionFilters<Prisma.AmendmentWhereInput>;

export async function getAmendment(
  where: Prisma.AmendmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment | null> {
  const authFilter = buildAuthorizationFilter<Prisma.AmendmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter !== null) {
    const authorizedAmendment = await selectAmendment(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedAmendment) {
      return authorizedAmendment;
    }
  }

  const amendment = await selectAmendment(where, tx);
  if (amendment) {
    log.warn(
      `User ${user.id} attempted to access Amendment ${amendment.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Amendment not found or User does not have Permission to view it.");
}

export async function getManyAmendments(
  where: Prisma.AmendmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment[]> {
  const authFilter = buildAuthorizationFilter<Prisma.AmendmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyAmendments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
