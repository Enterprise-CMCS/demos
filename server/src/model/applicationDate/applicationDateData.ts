import { Prisma, ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectApplicationDate, selectManyApplicationDates } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";

export const isAStatePointOfContactAssociatedWithApplicationDate = (
  userId: string
): Prisma.ApplicationDateWhereInput => ({
  application: isAStatePointOfContactAssociatedWithApplication(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All ApplicationDates": {
      NOT: {
        applicationId: {
          in: [],
        },
      },
    },
    "View ApplicationDates on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithApplicationDate(userId),
  }) satisfies PermissionFilters<Prisma.ApplicationDateWhereInput>;

export async function getApplicationDate(
  where: Prisma.ApplicationDateWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationDate | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationDateWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectApplicationDate(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyApplicationDates(
  where: Prisma.ApplicationDateWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationDate[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationDateWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyApplicationDates(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
