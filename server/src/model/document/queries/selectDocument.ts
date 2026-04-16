import { Document as PrismaDocument, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectDocument(
  where: Prisma.DocumentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.document.findAtMostOne({ where });
}
