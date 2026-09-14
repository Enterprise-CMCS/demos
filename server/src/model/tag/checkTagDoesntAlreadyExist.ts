import { PrismaTransactionClient } from "../../prismaClient";
import { selectTag } from "./queries/selectTag";

export async function checkTagDoesntAlreadyExist(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const existingTagName = await selectTag(tagName, "Demonstration Type", tx);

  if (existingTagName) {
    return `Cannot create new tag with name ${tagName} as it already exists.`;
  }
}
