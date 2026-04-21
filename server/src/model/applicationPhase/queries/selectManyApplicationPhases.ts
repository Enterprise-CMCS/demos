import { ApplicationPhase as PrismaApplicationPhase, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyApplicationPhases(
  where: Prisma.ApplicationPhaseWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationPhase[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationPhase.findMany({ where });
}
