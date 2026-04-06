import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getDeliverable(
  filter: Prisma.DeliverableWhereUniqueInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverable.findUniqueOrThrow({
    where: { ...filter },
  });
}
