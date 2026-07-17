import { SystemRoleAssignment as PrismaSystemRoleAssignment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function insertSystemRoleAssignment(
  input: Prisma.SystemRoleAssignmentUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaSystemRoleAssignment> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.systemRoleAssignment.create({ data: input });
}
