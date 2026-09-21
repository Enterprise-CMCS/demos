import { Prisma, TagName as PrismaTagName } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
export async function selectTagName(
  where: Prisma.TagNameWhereUniqueInput,
  data: Prisma.TagNameUpdateInput,
  tx: PrismaTransactionClient
): Promise<PrismaTagName> {
  return tx.tagName.update({
    where,
    data,
  });
}
