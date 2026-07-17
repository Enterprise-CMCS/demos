import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function updateDocument(
  where: Prisma.DocumentWhereUniqueInput,
  data: Prisma.DocumentUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  const prismaClient = tx ?? prisma();
  return prismaClient.document.update({ where, data });
}
