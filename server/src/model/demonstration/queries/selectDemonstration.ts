import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectDemonstration(
  where: Prisma.DemonstrationWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.demonstration.findAtMostOne({ where });
}
