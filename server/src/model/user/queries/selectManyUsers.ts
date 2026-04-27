import { User as PrismaUser, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyUsers(
  where: Prisma.UserWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaUser[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.user.findMany({ where });
}
