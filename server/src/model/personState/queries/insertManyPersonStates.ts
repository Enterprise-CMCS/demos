import type { Prisma } from "@prisma/client";
import { prisma, type PrismaTransactionClient } from "../../../prismaClient";

export async function insertManyPersonStates(
  data: Prisma.PersonStateCreateManyInput[],
  tx?: PrismaTransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma();
  await prismaClient.personState.createMany({ data });
}
