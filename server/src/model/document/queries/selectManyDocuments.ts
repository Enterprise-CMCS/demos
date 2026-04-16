import { Document as PrismaDocument, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyDocuments(
  where: Prisma.DocumentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.document.findMany({ where });
}
