import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SelectDeliverableActionRowResult } from ".";

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: true,
  tx?: PrismaTransactionClient
): Promise<SelectDeliverableActionRowResult>;

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: false,
  tx?: PrismaTransactionClient
): Promise<SelectDeliverableActionRowResult | null>;

export async function selectDeliverableAction(
  where: Prisma.DeliverableActionWhereInput,
  shouldAlwaysReturn: boolean,
  tx?: PrismaTransactionClient
): Promise<SelectDeliverableActionRowResult | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.deliverableAction.findAtMostOne({ 
    where,     
    include: {
      user: {
        include: {
          person: true,
        },
      },
      activeExtension: true,
    }, 
  });
  if (shouldAlwaysReturn && !result) {
    throw new Error(
      `Expected selectDeliverableAction to return a record but it did not! Where clause: ${JSON.stringify(where)}`
    );
  }
  return result;
}
