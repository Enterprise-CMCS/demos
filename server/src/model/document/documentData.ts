import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectDocument, selectManyDocuments } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";
import { log } from "../../log";

export const isAStatePointOfContactAssociatedWithDocument = (
  userId: string
): Prisma.DocumentWhereInput => ({
  application: isAStatePointOfContactAssociatedWithApplication(userId),
});
const getPermissionFilters = (userId: string) =>
  ({
    "View All Documents": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Documents on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithDocument(userId),
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

  if (authFilter !== null) {
    const authorizedDocument = await selectDocument(
      {
        AND: [where, authFilter],
      },
      tx
    );

    if (authorizedDocument) {
      return authorizedDocument;
    }
  }

  const document = await selectDocument(where, tx);
  if (document) {
    log.warn(
      `User ${user.id} attempted to access Document ${document.id} without sufficient permissions.`
    );
  }

  throw new Error("Requested Document not found or User does not have Permission to view it.");
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
