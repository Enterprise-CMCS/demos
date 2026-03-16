import { PrismaTransactionClient } from "../../prismaClient";
import { TagName } from "../../types";
import { createNewTagNameIfNotExists } from "../tagName";
import { createNewTagIfNotExists } from "../tag";

export async function createApplicationTagsDemonstrationTypesIfNotExists(
  newTags: TagName[],
  tx: PrismaTransactionClient
): Promise<void> {
  for (const newTag of newTags) {
    await createNewTagNameIfNotExists(newTag, tx);
    await createNewTagIfNotExists(newTag, "Application", tx);
    await createNewTagIfNotExists(newTag, "Demonstration Type", tx);
  }
}
