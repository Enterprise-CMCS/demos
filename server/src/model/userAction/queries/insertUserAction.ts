import { UserAction as PrismaUserAction } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { UserActionType, UserType } from "../../../types";

export async function insertUserAction(
  userId: string,
  personTypeId: UserType,
  userActionType: UserActionType,
  tx?: PrismaTransactionClient
): Promise<PrismaUserAction> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.userAction.create({
    data: {
      actionTimestamp: new Date(),
      userId: userId,
      personTypeId: personTypeId,
      actionTypeId: userActionType,
    },
  });
}
