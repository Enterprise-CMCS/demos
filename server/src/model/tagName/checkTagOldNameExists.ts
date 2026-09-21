import { PrismaTransactionClient } from "../../prismaClient";
import { selectTagName } from "./queries/selectTagName";

export async function checkTagOldNameExists(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const existingTagName = await selectTagName(tagName, tx);

  if (!existingTagName) {
    return `Cannot rename tag named ${tagName} as the name does not exist.`;
  }
}
