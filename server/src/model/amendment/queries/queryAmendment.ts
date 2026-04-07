import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function queryAmendment(
  where: Prisma.AmendmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment | null> {
  const prismaClient = tx ?? prisma();
  const amendments = await prismaClient.amendment.findMany({
    where,
  });

  if (amendments.length === 0) {
    return null;
  }
  if (amendments.length > 1) {
    throw new Error(`Expected to find at most one Amendment, but found ${amendments.length}`);
  }
  return amendments[0];
}
