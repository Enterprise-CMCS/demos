import { User as PrismaUser, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function insertUser(
  input: Prisma.UserUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaUser> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.user.create({ data: input });
}
