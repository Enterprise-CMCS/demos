import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function queryManyDemonstrations(
  where: Prisma.DemonstrationWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.demonstration.findMany({ where });
}
