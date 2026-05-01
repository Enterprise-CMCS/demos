import { Prisma, ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectApplicationNote, selectManyApplicationNotes } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";

export const isAStatePointOfContactAssociatedWithApplicationNote = (
  userId: string
): Prisma.ApplicationNoteWhereInput => ({
  application: isAStatePointOfContactAssociatedWithApplication(userId),
});

const getPermissionFilters = (userId: string) =>
  ({
    "View All ApplicationNotes": {
      NOT: {
        applicationId: {
          in: [],
        },
      },
    },
    "View ApplicationNotes on Assigned Demonstrations":
      isAStatePointOfContactAssociatedWithApplicationNote(userId),
  }) satisfies PermissionFilters<Prisma.ApplicationNoteWhereInput>;

export async function getApplicationNote(
  where: Prisma.ApplicationNoteWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationNote | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationNoteWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectApplicationNote(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyApplicationNotes(
  where: Prisma.ApplicationNoteWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationNote[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationNoteWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyApplicationNotes(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
