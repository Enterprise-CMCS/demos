import type { Prisma, Tag as PrismaTag } from "@prisma/client";
import type { PrismaTransactionClient } from "../../../prismaClient";
import { prisma } from "../../../prismaClient";

export async function updateTags(
  where: Prisma.TagWhereInput,
  updateData: Prisma.TagUncheckedUpdateManyInput,
  tx?: PrismaTransactionClient
): Promise<PrismaTag[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.tag.updateManyAndReturn({
    where: where,
    data: updateData,
  });
}
