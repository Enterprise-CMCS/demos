import { DeliverableExtension as PrismaDeliverableExtension, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectDeliverableExtension(
  where: Prisma.DeliverableExtensionWhereInput,
  shouldAlwaysReturn: true,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension>;

export async function selectDeliverableExtension(
  where: Prisma.DeliverableExtensionWhereInput,
  shouldAlwaysReturn: false,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension | null>;

export async function selectDeliverableExtension(
  where: Prisma.DeliverableExtensionWhereInput,
  shouldAlwaysReturn: boolean,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverableExtension | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.deliverableExtension.findAtMostOne({ where });
  if (shouldAlwaysReturn && !result) {
    throw new Error(
      `Expected selectDeliverableExtension to return a record but it did not! Where clause: ${JSON.stringify(where)}`
    );
  }
  return result;
}
