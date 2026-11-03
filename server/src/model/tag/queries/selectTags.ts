import type { Prisma, Tag as PrismaTag } from "@prisma/client";
import type { PrismaTransactionClient } from "../../../prismaClient";
import { prisma } from "../../../prismaClient";

export async function selectTags(
  where: Prisma.TagWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaTag[]> {
  const prismaClient = tx ?? prisma();
  return prismaClient.tag.findMany({
    where: where,
  });
}
