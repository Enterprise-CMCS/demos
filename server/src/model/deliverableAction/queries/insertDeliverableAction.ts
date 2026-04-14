import { DeliverableAction as PrismaDeliverableAction } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient.js";
import { DeliverableAction } from "..";

export async function insertDeliverableAction(
  action: DeliverableAction,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableAction> {
  const prismaClient = tx ?? prisma();
  const actionTypeConfig = await prismaClient.deliverableActionType.findUniqueOrThrow({
    where: { id: action.actionType },
  });
  return await prismaClient.deliverableAction.create({
    data: {
      actionTimestamp: new Date(),
      deliverableId: action.deliverableId,
      actionTypeId: action.actionType,
      oldStatusId: action.oldStatus,
      newStatusId: action.newStatus,
      note: action.note,
      dueDateChangeAllowed: actionTypeConfig.dueDateChangeAllowed,
      shouldHaveNote: actionTypeConfig.shouldHaveNote,
      shouldHaveUserId: actionTypeConfig.shouldHaveUserId,
      oldDueDate: action.oldDueDate,
      newDueDate: action.newDueDate,
      userId: action.userId,
    },
  });
}
