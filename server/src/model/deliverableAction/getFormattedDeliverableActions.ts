import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { DeliverableAction } from "../../types";
import { formatDeliverableAction } from ".";
import { selectManyDeliverableActions } from "./queries";

export async function getFormattedDeliverableActions(
  deliverableId: string,
  tx?: PrismaTransactionClient
): Promise<DeliverableAction[]> {
  const prismaClient = tx ?? prisma();
  const queryResults = await selectManyDeliverableActions(
    { deliverableId: deliverableId },
    prismaClient
  );
  return queryResults.map((result) => formatDeliverableAction(result));
}
