import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function queryDemonstration(
  where: Prisma.DemonstrationWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration | null> {
  const prismaClient = tx ?? prisma();
  const demonstrations = await prismaClient.demonstration.findMany({
    where,
  });

  if (demonstrations.length === 0) {
    return null;
  }
  if (demonstrations.length > 1) {
    throw new Error(
      `Expected to find at most one Demonstration, but found ${demonstrations.length}`
    );
  }
  return demonstrations[0];
}
