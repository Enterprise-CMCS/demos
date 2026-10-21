import { PrismaTransactionClient } from "../../prismaClient";
import { selectTagName } from ".";

export async function checkTagNewNameDoesNotExist(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const existingTagName = await selectTagName(tagName, tx);

  if (existingTagName) {
    return `Cannot rename tag to name ${tagName} as the name already exists.`;
  }
}
