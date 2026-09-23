import { PrismaTransactionClient } from "../../prismaClient";
import { selectTags } from ".";

export async function checkTagDoesntAlreadyExist(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const existingTagName = await selectTags({ tagNameId: tagName }, tx);

  if (existingTagName.length > 0) {
    return `Cannot create new tag with name ${tagName} as it already exists.`;
  }
}
