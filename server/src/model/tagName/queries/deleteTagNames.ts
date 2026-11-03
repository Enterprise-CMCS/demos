import type { Prisma } from "@prisma/client";
import type { PrismaTransactionClient } from "../../../prismaClient";
import { prisma } from "../../../prismaClient";

export async function deleteTagNames(
  where: Prisma.TagNameWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.tagName.deleteMany({ where: where });
  return result.count;
}
