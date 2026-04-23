import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectExtension(
  where: Prisma.ExtensionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.extension.findAtMostOne({ where });
}
