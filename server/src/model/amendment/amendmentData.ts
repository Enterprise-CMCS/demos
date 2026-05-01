import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectAmendment, selectManyAmendments } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";

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

  if (authFilter === null) {
    return null;
  }

  return await selectAmendment(
    {
      AND: [where, authFilter],
    },
    tx
  );
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
