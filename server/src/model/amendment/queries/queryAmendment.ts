import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";

export async function queryAmendment(
  where: Prisma.AmendmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment | null> {
  const prismaClient = tx ?? prisma();
  return queryAtMostOne(prismaClient.amendment, where);
}
