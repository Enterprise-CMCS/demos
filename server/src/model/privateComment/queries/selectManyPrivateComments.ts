import { PrivateComment as PrismaPrivateComment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyPrivateComments(
  where: Prisma.PrivateCommentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPrivateComment[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.privateComment.findMany({ where });
}
