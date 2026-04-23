import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectExtension, selectManyExtensions } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Extensions": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Extensions on Assigned Demonstrations": {
      demonstration: isStatePointOfContactOnDemonstration(userId),
    },
  }) satisfies PermissionFilters<Prisma.ExtensionWhereInput>;

export async function getExtension(
  where: Prisma.ExtensionWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ExtensionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectExtension(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyExtensions(
  where: Prisma.ExtensionWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ExtensionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyExtensions(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
