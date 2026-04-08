import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";

export async function queryDemonstration(
  where: Prisma.DemonstrationWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration | null> {
  const prismaClient = tx ?? prisma();
  return queryAtMostOne(prismaClient.demonstration, where);
}
