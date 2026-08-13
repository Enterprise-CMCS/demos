import type { Prisma } from "@prisma/client";
import { prisma, type PrismaTransactionClient } from "../../../prismaClient";

export async function deleteManyPersonStates(
  where: Prisma.PersonStateWhereInput,
  tx?: PrismaTransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma();
  await prismaClient.personState.deleteMany({ where });
}
