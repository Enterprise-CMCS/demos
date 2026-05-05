import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DemonstrationTypeTagAssignmentQueryResult } from ".";

export async function selectManyDemonstrationTypeTagAssignments(
  where: Prisma.DemonstrationTypeTagAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<DemonstrationTypeTagAssignmentQueryResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.demonstrationTypeTagAssignment.findMany({
    where,
    include: {
      tag: true,
    },
  });
}
