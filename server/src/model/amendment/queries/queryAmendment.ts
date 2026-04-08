import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function queryAmendment(
  where: Prisma.AmendmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.amendment.findAtMostOne({ where });
}
