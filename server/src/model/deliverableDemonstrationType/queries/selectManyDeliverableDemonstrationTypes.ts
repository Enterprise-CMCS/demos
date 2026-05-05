import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableDemonstrationTypeQueryResult } from ".";

export async function selectManyDeliverableDemonstrationTypes(
  where: Prisma.DeliverableDemonstrationTypeWhereInput,
  tx?: PrismaTransactionClient
): Promise<DeliverableDemonstrationTypeQueryResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableDemonstrationType.findMany({
    where,
    include: {
      demonstrationTypeTagAssignment: {
        include: {
          tag: true,
        },
      },
    },
  });
}
