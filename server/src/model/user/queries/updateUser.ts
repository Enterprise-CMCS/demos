import { Prisma, User as PrismaUser } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function updateUser(
  where: Prisma.UserWhereUniqueInput,
  updateData: Prisma.UserUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaUser> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.user.update({ where: where, data: updateData });
}
