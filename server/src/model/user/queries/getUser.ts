import { User as PrismaUser } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getUser(id: string, tx?: PrismaTransactionClient): Promise<PrismaUser> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.user.findUniqueOrThrow({
    where: { id: id },
  });
}
