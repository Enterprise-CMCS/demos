import {
  Prisma,
} from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SelectDeliverableActionRowResult } from ".";

export async function selectManyDeliverableActions(
  where: Prisma.DeliverableActionWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<SelectDeliverableActionRowResult[]> {
  const prismaClient = tx ?? prisma();
  const deliverableActions = await prismaClient.deliverableAction.findMany({
    where: where,
    orderBy: {
      actionTimestamp: "asc",
    },
    include: {
      user: {
        include: {
          person: true,
        },
      },
      activeExtension: true,
    },
  });

  return deliverableActions;
}
