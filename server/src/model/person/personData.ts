import { Prisma, Person as PrismaPerson } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectPerson, selectManyPeople } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithDemonstrationRoleAssignment } from "../demonstrationRoleAssignment/demonstrationRoleAssignmentData";
import { isAStatePointOfContactAssociatedWithUser } from "../user/userData";

export const isAStatePointOfContactAssociatedWithPerson = (
  userId: string
): Prisma.PersonWhereInput => ({
  OR: [
    {
      demonstrationRoleAssignments: {
        some: isAStatePointOfContactAssociatedWithDemonstrationRoleAssignment(userId),
      },
    },
    {
      user: isAStatePointOfContactAssociatedWithUser(userId),
    },
  ],
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All People": {
      NOT: {
        id: {
          in: [],
        },
      },
    },
    "View People on Assigned Demonstrations": isAStatePointOfContactAssociatedWithPerson(userId),
  }) satisfies PermissionFilters<Prisma.PersonWhereInput>;

export async function getPerson(
  where: Prisma.PersonWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson | null> {
  const authFilter = buildAuthorizationFilter<Prisma.PersonWhereInput>(user, getPermissionFilters);

  if (authFilter === null) {
    return null;
  }

  return await selectPerson(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyPeople(
  where: Prisma.PersonWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson[]> {
  const authFilter = buildAuthorizationFilter<Prisma.PersonWhereInput>(user, getPermissionFilters);

  if (authFilter === null) {
    return [];
  }
  return await selectManyPeople(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
