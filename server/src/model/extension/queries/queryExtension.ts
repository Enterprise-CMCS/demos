import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function queryExtension(
  where: Prisma.ExtensionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaExtension | null> {
  const prismaClient = tx ?? prisma();
  const extensions = await prismaClient.extension.findMany({
    where,
  });

  if (extensions.length === 0) {
    return null;
  }
  if (extensions.length > 1) {
    throw new Error(`Expected to find at most one Extension, but found ${extensions.length}`);
  }
  return extensions[0];
}
