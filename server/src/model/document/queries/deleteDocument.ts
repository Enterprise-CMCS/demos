import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function deleteDocument(
  where: Prisma.DocumentWhereUniqueInput,
  tx: PrismaTransactionClient
): Promise<PrismaDocument> {
  return tx.document.delete({ where });
}
