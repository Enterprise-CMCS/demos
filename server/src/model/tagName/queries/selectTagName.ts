import { PrismaTransactionClient } from "../../../prismaClient";
import { TagName } from "../../../types";
import { TagName as PrismaTagName } from "@prisma/client";
export async function createNewTagNameIfNotExists(
  newTagName: TagName,
  tx: PrismaTransactionClient
): Promise<PrismaTagName> {
  return tx.tagName.findUnique({
    where: {
      id: newTagName,
    },
  });
}
