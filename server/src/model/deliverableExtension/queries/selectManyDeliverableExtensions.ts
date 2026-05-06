import { Prisma, DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyDeliverableExtensions(
  where: Prisma.DeliverableExtensionWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension[]> {
  const prismaClient = tx ?? prisma();
  const deliverableExtensions = await prismaClient.deliverableExtension.findMany({
    where: where,
  });

  return deliverableExtensions;
}
