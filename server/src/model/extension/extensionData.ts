import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectExtension, selectManyExtensions } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";
import { log } from "../../log";

export const isAStatePointOfContactAssociatedWithExtension = (
  userId: string
): Prisma.ExtensionWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All Extensions": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Extensions on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithExtension(userId),
  }) satisfies PermissionFilters<Prisma.ExtensionWhereInput>;

export async function getExtension(
  where: Prisma.ExtensionWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension> {
  const authFilter = buildAuthorizationFilter<Prisma.ExtensionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter !== null) {
    const authorizedExtension = await selectExtension(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedExtension) {
      return authorizedExtension;
    }
  }

  const extension = await selectExtension(where, tx);
  if (extension) {
    log.warn(
      `User ${user.id} attempted to access Extension ${extension.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Extension not found or User does not have Permission to view it.");
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
