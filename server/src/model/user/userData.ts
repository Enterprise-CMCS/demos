import { Prisma, User as PrismaUser } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectUser, selectManyUsers } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import {
  isStatePointOfContactAssociatedToApplication,
} from "../../auth/buildAuthorizationFilter";

const getPermissionFilters = (userId: string) =>
  ({
    "View All Users": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View Users on Assigned Demonstrations": {
      OR: [
        {
          deliverables: {
            some: {
              demonstration: isStatePointOfContactOnDemonstration(userId),
            },
          },
        },
        {
          person: {
            demonstrationRoleAssignments: {
              some: {
                demonstration: isStatePointOfContactOnDemonstration(userId),
              },
            },
          },
        },
        {
          documents: {
            some: {
              application: isStatePointOfContactAssociatedToApplication(userId),
            },
          },
        },
        {
          events: {
            some: {
              application: isStatePointOfContactAssociatedToApplication(userId),
            },
          },
        },
      ],
    },
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
