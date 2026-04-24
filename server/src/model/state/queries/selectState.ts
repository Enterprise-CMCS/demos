import { State as PrismaState, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectState(
  where: Prisma.StateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaState | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.state.findAtMostOne({ where });
}
