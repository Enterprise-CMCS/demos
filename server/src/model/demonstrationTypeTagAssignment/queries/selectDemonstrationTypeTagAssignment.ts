import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DemonstrationTypeTagAssignmentQueryResult } from ".";

export async function selectDemonstrationTypeTagAssignment(
  where: Prisma.DemonstrationTypeTagAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<DemonstrationTypeTagAssignmentQueryResult | null> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.demonstrationTypeTagAssignment.findAtMostOne({
    where,
    include: {
      tag: true,
    },
  });
}
