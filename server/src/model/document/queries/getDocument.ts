import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getDocument(
  filter: Prisma.DocumentWhereUniqueInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.document.findUniqueOrThrow({
    where: { ...filter },
  });
}
