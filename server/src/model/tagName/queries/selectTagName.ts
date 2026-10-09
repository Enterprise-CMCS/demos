import { TagName as PrismaTagName } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
export async function selectTagName(
  id: string,
  tx: PrismaTransactionClient
): Promise<PrismaTagName | null> {
  return tx.tagName.findUnique({
    where: { id },
  });
}
