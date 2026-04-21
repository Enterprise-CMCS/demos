import { ApplicationPhase as PrismaApplicationPhase, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectApplicationPhase(
  where: Prisma.ApplicationPhaseWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationPhase | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.applicationPhase.findAtMostOne({ where });
}
