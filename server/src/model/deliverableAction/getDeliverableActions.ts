import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { DeliverableAction, DeliverableActionType } from "../../types";
import { selectManyDeliverableActions } from "./queries/selectManyDeliverableActions";

export async function getDeliverableActions(
  deliverableId: string,
  tx?: PrismaTransactionClient
): Promise<DeliverableAction[]> {
  const prismaClient = tx ?? prisma();
  const queryResults = await selectManyDeliverableActions(
    { deliverableId: deliverableId },
    prismaClient
  );
  const results: DeliverableAction[] = queryResults.map((result) => {
    return {
      id: result.id,
      actionTimestamp: result.actionTimestamp,
      actionType: result.actionTypeId as DeliverableActionType,
      note: result.note,
    };
  });
  return results;
}
