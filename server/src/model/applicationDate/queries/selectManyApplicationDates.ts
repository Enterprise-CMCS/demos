import { ApplicationDate as PrismaApplicationDate, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyApplicationDates(
  where: Prisma.ApplicationDateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationDate[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationDate.findMany({ where });
}
