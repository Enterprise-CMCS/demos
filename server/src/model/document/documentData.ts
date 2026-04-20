import { Prisma, Document as PrismaDocument } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectDocument, selectManyDocuments } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Documents": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Documents on Assigned Demonstrations": {
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
    "View Owned Documents": {
      ownerUserId: userId,
    },
  }) satisfies PermissionFilters<Prisma.DocumentWhereInput>;

export async function getDocument(
  where: Prisma.DocumentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument | null> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectDocument(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyDocuments(
  where: Prisma.DocumentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument[]> {
  const authFilter = buildAuthorizationFilter<Prisma.DocumentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyDocuments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
