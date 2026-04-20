import { Prisma, DeliverableAction as PrismaDeliverableAction } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyDeliverableActions(
  where: Prisma.DeliverableActionWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableAction[]> {
  const prismaClient = tx ?? prisma();
  const deliverableActions = await prismaClient.deliverableAction.findMany({ where });
  return deliverableActions;
}
