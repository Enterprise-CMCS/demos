import { DeliverableExtension as PrismaDeliverableExtension } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectDeliverableExtension(
  deliverableExtensionId: string,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableExtension.findUniqueOrThrow({
    where: {
      id: deliverableExtensionId,
    },
  });
}
