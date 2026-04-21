import { ApplicationDate as PrismaApplicationDate, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectApplicationDate(
  where: Prisma.ApplicationDateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationDate | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.applicationDate.findAtMostOne({ where });
}
