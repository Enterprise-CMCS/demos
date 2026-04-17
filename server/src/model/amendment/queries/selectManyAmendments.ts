import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyAmendments(
  where: Prisma.AmendmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.amendment.findMany({ where });
}
