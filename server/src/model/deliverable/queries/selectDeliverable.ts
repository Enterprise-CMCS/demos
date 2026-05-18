import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DELETED_DELIVERABLE_STATUS } from "../../../constants";

export async function selectDeliverable(
  filter: Prisma.DeliverableWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable | null> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverable.findAtMostOne({
    where: {
      ...filter,
      NOT: { statusId: DELETED_DELIVERABLE_STATUS },
    },
  });
}
