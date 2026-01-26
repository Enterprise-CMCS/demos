import { PrismaTransactionClient } from "../../prismaClient";
import { Tag } from "../../types";
import { createNewTagIfNotExists } from "../tag";
import { createNewTagConfigurationIfNotExists } from "../tagConfiguration";

export async function createApplicationTagsDemonstrationTypesIfNotExists(
  newTags: Tag[],
  tx: PrismaTransactionClient
): Promise<void> {
  for (const newTag of newTags) {
    await createNewTagIfNotExists(newTag, tx);
    await createNewTagConfigurationIfNotExists(newTag, "Application", tx);
    await createNewTagConfigurationIfNotExists(newTag, "Demonstration Type", tx);
  }
}
