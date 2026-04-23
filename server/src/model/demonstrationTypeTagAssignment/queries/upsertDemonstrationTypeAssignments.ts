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
        demonstrationId_tagNameId: {
          demonstrationId: demonstrationId,
          tagNameId: recordToUpsert.demonstrationTypeName,
        },
      },
      update: {
        effectiveDate: recordToUpsert.demonstrationTypeDates.effectiveDate,
        expirationDate: recordToUpsert.demonstrationTypeDates.expirationDate,
      },
      create: {
        demonstrationId: demonstrationId,
        tagNameId: recordToUpsert.demonstrationTypeName,
        tagTypeId: "Demonstration Type" satisfies TagType,
        effectiveDate: recordToUpsert.demonstrationTypeDates.effectiveDate,
        expirationDate: recordToUpsert.demonstrationTypeDates.expirationDate,
      },
    });
  }
}
