import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getManyDocuments(
  filter: Prisma.DocumentWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<PrismaDocument[]> {
  const prismaClient = tx ?? prisma();
  const documents = await prismaClient.document.findMany({
    where: { ...filter },
  });
  return documents;
}
