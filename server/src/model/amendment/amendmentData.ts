import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectAmendment, selectManyAmendments } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Amendments": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Amendments on Assigned Demonstrations": {
      demonstration: isStatePointOfContactOnDemonstration(userId),
    },
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
