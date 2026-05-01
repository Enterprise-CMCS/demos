import { Prisma, User as PrismaUser } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectUser, selectManyUsers } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDocument } from "../document/documentData";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";
import { isAStatePointOfContactAssociatedWithPerson } from "../person/personData";
import { isAStatePointOfContactAssociatedWithDeliverable } from "../deliverable/deliverableData";

export const isAStatePointOfContactAssociatedWithUser = (
  userId: string
): Prisma.UserWhereInput => ({
  OR: [
    {
      deliverables: {
        some: isAStatePointOfContactAssociatedWithDeliverable(userId),
      },
    },
    {
      person: isAStatePointOfContactAssociatedWithPerson(userId),
    },
    {
      documents: {
        some: isAStatePointOfContactAssociatedWithDocument(userId),
      },
    },
    {
      events: {
        some: {
          application: isAStatePointOfContactAssociatedWithApplication(userId),
        },
      },
    },
  ],
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All Users": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Users on Assigned Demonstrations": isAStatePointOfContactAssociatedWithUser(userId),
    "View My User": {
      id: userId,
    },
  }) satisfies PermissionFilters<Prisma.UserWhereInput>;

export async function getUser(
  where: Prisma.UserWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaUser | null> {
  const authFilter = buildAuthorizationFilter<Prisma.UserWhereInput>(user, getPermissionFilters);
  if (authFilter === null) {
    return null;
  }

  return await selectUser(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyUsers(
  where: Prisma.UserWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaUser[]> {
  const authFilter = buildAuthorizationFilter<Prisma.UserWhereInput>(user, getPermissionFilters);

  if (authFilter === null) {
    return [];
  }
  return await selectManyUsers(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
