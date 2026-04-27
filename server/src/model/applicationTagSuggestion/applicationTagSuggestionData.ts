import { Prisma, ApplicationTagSuggestion as PrismaApplicationTagSuggestion } from "@prisma/client";
import {
  buildAuthorizationFilter,
  isStatePointOfContactOnDemonstration,
  PermissionFilters,
  ContextUser,
} from "../../auth";
import { selectApplicationTagSuggestion, selectManyApplicationTagSuggestions } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  
  ({
    "View All ApplicationTagSuggestions": {
      NOT: {
        applicationId: {
          in: [],
        },
      },
    },
    "View ApplicationTagSuggestions on Assigned Demonstrations": {
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
  }) satisfies PermissionFilters<Prisma.ApplicationTagSuggestionWhereInput>;

export async function getApplicationTagSuggestion(
  where: Prisma.ApplicationTagSuggestionWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationTagSuggestion | null> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationTagSuggestionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return null;
  }

  return await selectApplicationTagSuggestion(
    {
      AND: [where, authFilter],
    },
    tx
  );
}

export async function getManyApplicationTagSuggestions(
  where: Prisma.ApplicationTagSuggestionWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationTagSuggestion[]> {
  const authFilter = buildAuthorizationFilter<Prisma.ApplicationTagSuggestionWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManyApplicationTagSuggestions(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
