import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";

export async function queryExtension(
  where: Prisma.ExtensionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension | null> {
  const prismaClient = tx ?? prisma();
  return queryAtMostOne(prismaClient.extension, where);
}
