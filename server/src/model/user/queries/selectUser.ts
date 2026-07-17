import { User as PrismaUser, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectUser(
  where: Prisma.UserWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaUser | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.user.findAtMostOne({ where });
}
