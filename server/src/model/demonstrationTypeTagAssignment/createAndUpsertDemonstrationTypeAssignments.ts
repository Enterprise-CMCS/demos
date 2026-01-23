import { PrismaTransactionClient } from "../../prismaClient";
import { ParsedSetDemonstrationTypesInput, upsertDemonstrationTypeAssignments } from ".";
import { createApplicationTagsDemonstrationTypesIfNotExists } from "../applicationTagAssignment";

export async function createAndUpsertDemonstrationTypeAssignments(
  input: ParsedSetDemonstrationTypesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const demonstrationTypeTags = input.demonstrationTypesToUpsert.map(
    (demonstrationType) => demonstrationType.demonstrationTypeName
  );
  await createApplicationTagsDemonstrationTypesIfNotExists(demonstrationTypeTags, tx);
  await upsertDemonstrationTypeAssignments(
    input.demonstrationId,
    input.demonstrationTypesToUpsert,
    tx
  );
}
