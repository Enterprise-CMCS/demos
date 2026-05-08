import { PublicComment as PrismaPublicComment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyPublicComments(
  where: Prisma.PublicCommentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPublicComment[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.publicComment.findMany({ where });
}
