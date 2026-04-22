import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { ApplicationTagAssignmentQueryResult } from ".";

export async function selectManyApplicationTagAssignments(
  where: Prisma.ApplicationTagAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<ApplicationTagAssignmentQueryResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationTagAssignment.findMany({
    where,
    include: {
      tag: true,
    },
  });
}
