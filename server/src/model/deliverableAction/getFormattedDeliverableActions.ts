import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { DeliverableAction, DeliverableActionType, NonEmptyString } from "../../types";
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
    let userFullName: NonEmptyString | null = null;
    if (result.user) {
      userFullName = [result.user.person.firstName, result.user.person.lastName].join(" ").trim();
    }
    return {
      id: result.id,
      actionTimestamp: result.actionTimestamp,
      actionType: result.actionTypeId as DeliverableActionType,
      note: result.note,
      userFullName: userFullName,
    };
  });
  return results;
}
