import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { DeliverableAction, DeliverableActionType } from "../../types";
import { formatDetailsMessage, formatFullUserName } from "./deliverableActionFormattingFunctions";
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
  const results: DeliverableAction[] = queryResults.map((result) => {
    return {
      id: result.id,
      actionTimestamp: result.actionTimestamp,
      actionType: result.actionTypeId as DeliverableActionType,
      details: formatDetailsMessage(result),
      userFullName: formatFullUserName(result),
    };
  });
  return results;
}
