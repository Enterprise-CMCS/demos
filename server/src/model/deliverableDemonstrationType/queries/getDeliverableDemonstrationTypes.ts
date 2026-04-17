import { DeliverableDemonstrationType as PrismaDeliverableDemonstrationType } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getDeliverableDemonstrationTypes(
  deliverableId: string,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableDemonstrationType[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableDemonstrationType.findMany({
    where: {
      deliverableId: deliverableId,
    },
  });
}
