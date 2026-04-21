import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableDemonstrationTypeQueryResult } from ".";

export async function selectDeliverableDemonstrationType(
  where: Prisma.DeliverableDemonstrationTypeWhereInput,
  tx?: PrismaTransactionClient
): Promise<DeliverableDemonstrationTypeQueryResult | null> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableDemonstrationType.findAtMostOne({
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
