import { ApplicationAction as PrismaApplicationAction } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { ApplicationActionType, DateType } from "../../../types";

export type InsertApplicationActionInput = {
  applicationId: string;
  actionType: ApplicationActionType;
  dateType?: DateType;
  noteType?: string;
  userId?: string;
};

export async function insertApplicationAction(
  action: InsertApplicationActionInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationAction> {
  const prismaClient = tx ?? prisma();
  const actionTypeConfig = await prismaClient.applicationActionType.findUniqueOrThrow({
    where: { id: action.actionType },
  });
  return await prismaClient.applicationAction.create({
    data: {
      actionTimestamp: new Date(),
      applicationId: action.applicationId,
      actionTypeId: action.actionType,
      dateTypeId: action.dateType,
      noteTypeId: action.noteType,
      shouldHaveUserId: actionTypeConfig.shouldHaveUserId,
      shouldHaveDateTypeId: actionTypeConfig.shouldHaveDateTypeId,
      shouldHaveNoteTypeId: actionTypeConfig.shouldHaveNoteTypeId,
      userId: action.userId,
    },
  });
}
