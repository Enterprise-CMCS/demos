import { SystemRoleAssignment as PrismaSystemRoleAssignment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SystemRoleAssignmentQueryResult } from "..";

export async function selectManySystemRoleAssignments(
  where: Prisma.SystemRoleAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<SystemRoleAssignmentQueryResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.systemRoleAssignment.findMany({
    where,
    include: {
      role: {
        include: {
          rolePermissions: true,
        },
      },
    },
  });
}
