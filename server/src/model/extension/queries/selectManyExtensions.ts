import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyExtensions(
  where: Prisma.ExtensionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.extension.findMany({ where });
}
