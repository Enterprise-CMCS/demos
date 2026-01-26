import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedSetDemonstrationTypesInput } from "..";

export async function deleteDemonstrationTypeAssignments(
  input: ParsedSetDemonstrationTypesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.demonstrationTypeTagAssignment.deleteMany({
    where: {
      demonstrationId: input.demonstrationId,
      tagId: {
        in: input.demonstrationTypesToDelete,
      },
    },
  });
}
