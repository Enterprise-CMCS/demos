import { PrismaTransactionClient } from "../../prismaClient";
import { selectTags } from ".";

export async function checkTagsDontAlreadyExist(
  tagNames: string[],
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const existingTags = await selectTags({ tagNameId: { in: tagNames } }, tx);

  const existingTagNames = [...new Set(existingTags.map((tag) => tag.tagNameId))].join(", ");
  if (existingTags.length > 0) {
    return `Cannot create new tags as one or more tags already exist: ${existingTagNames}.`;
  }
}
