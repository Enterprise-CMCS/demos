import { DeliverableAction as PrismaDeliverableAction } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DeliverableActionType, DeliverableStatus } from "../../../types";

export type InsertDeliverableActionInput = {
  deliverableId: string;
  actionType: DeliverableActionType;
  actionTime: Date;
  oldStatus: DeliverableStatus;
  newStatus: DeliverableStatus;
  oldDueDate: Date;
  newDueDate: Date;
  note?: string;
  userId?: string;
};

export async function insertDeliverableAction(
  action: InsertDeliverableActionInput,
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
      extensionIdOptional: actionTypeConfig.extensionIdOptional,
      oldDueDate: action.oldDueDate,
      newDueDate: action.newDueDate,
      userId: action.userId,
    },
  });
}
