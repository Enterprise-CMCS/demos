import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function updateDocument(
  where: Prisma.DocumentWhereUniqueInput,
  data: Prisma.DocumentUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  return tx
    ? tx.document.update({ where, data })
    : prisma().$transaction((transaction) => transaction.document.update({ where, data }));
}
