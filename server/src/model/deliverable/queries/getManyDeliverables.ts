import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getManyDeliverables(
  filter: Prisma.DeliverableWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable[]> {
  const prismaClient = tx ?? prisma();
  const deliverables = await prismaClient.deliverable.findMany({
    where: { ...filter },
  });
  return deliverables;
}
