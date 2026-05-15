import { Prisma, SystemRoleAssignment as PrismaSystemRoleAssignment } from "@prisma/client";
import { buildAuthorizationFilter, PermissionFilters, ContextUser } from "../../auth";
import { selectManySystemRoleAssignments, SystemRoleAssignmentQueryResult } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

const getPermissionFilters = (userId: string) =>
  ({
    "View All SystemRoleAssignments": {
      NOT: {
        personId: {
          in: [],
        },
      },
    },
    "View My SystemRoleAssignments": {
      personId: userId,
    },
  }) satisfies PermissionFilters<Prisma.SystemRoleAssignmentWhereInput>;

export async function getManySystemRoleAssignments(
  where: Prisma.SystemRoleAssignmentWhereInput,
  user: ContextUser,
  tx?: PrismaTransactionClient
): Promise<SystemRoleAssignmentQueryResult[]> {
  const authFilter = buildAuthorizationFilter<Prisma.SystemRoleAssignmentWhereInput>(
    user,
    getPermissionFilters
  );

  if (authFilter === null) {
    return [];
  }
  return await selectManySystemRoleAssignments(
    {
      AND: [where, authFilter],
    },
    tx
  );
}
