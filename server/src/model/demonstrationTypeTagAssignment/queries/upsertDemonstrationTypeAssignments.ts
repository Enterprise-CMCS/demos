import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedDemonstrationTypeInput } from "..";
import { TagType } from "../../../types";

export async function upsertDemonstrationTypeAssignments(
  demonstrationId: string,
  demonstartionTypeAssignemnts: ParsedDemonstrationTypeInput[],
  tx: PrismaTransactionClient
): Promise<void> {
  for (const recordToUpsert of demonstartionTypeAssignemnts) {
    await tx.demonstrationTypeTagAssignment.upsert({
      where: {
        demonstrationId_tagId: {
          demonstrationId: demonstrationId,
          tagId: recordToUpsert.demonstrationTypeName,
        },
      },
      update: {
        effectiveDate: recordToUpsert.demonstrationTypeDates.effectiveDate,
        expirationDate: recordToUpsert.demonstrationTypeDates.expirationDate,
      },
      create: {
        demonstrationId: demonstrationId,
        tagId: recordToUpsert.demonstrationTypeName,
        tagTypeId: "Demonstration Type" satisfies TagType,
        effectiveDate: recordToUpsert.demonstrationTypeDates.effectiveDate,
        expirationDate: recordToUpsert.demonstrationTypeDates.expirationDate,
      },
    });
  }
}
