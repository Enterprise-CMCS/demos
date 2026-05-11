import { DeliverableAction as PrismaDeliverableAction, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: true,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableAction>;

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: false,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableAction | null>;

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: boolean,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableAction | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.deliverableAction.findAtMostOne({ where });
  if (shouldAlwaysReturn && !result) {
    throw new Error(
      `Expected selectDeliverableAction to return a record but it did not! Where clause: ${JSON.stringify(where)}`
    );
  }
  return result;
}
