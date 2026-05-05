import { State as PrismaState, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyStates(
  where: Prisma.StateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaState[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.state.findMany({ where });
}
