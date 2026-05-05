import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { ApplicationTagAssignmentQueryResult } from ".";

export async function selectApplicationTagAssignment(
  where: Prisma.ApplicationTagAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<ApplicationTagAssignmentQueryResult | null> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationTagAssignment.findAtMostOne({
    where,
    include: {
      tag: true,
    },
  });
}
