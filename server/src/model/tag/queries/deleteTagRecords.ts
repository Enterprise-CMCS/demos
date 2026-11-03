import type { Prisma } from "@prisma/client";
import type { PrismaTransactionClient } from "../../../prismaClient";
import { prisma } from "../../../prismaClient";

export async function deleteTagRecords(
  where: Prisma.TagWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.tag.deleteMany({ where: where });
  return result.count;
}
