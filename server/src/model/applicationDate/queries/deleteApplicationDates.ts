import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "..";

export async function deleteApplicationDates(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  for (const dateToDelete of parsedInputApplicationDates.applicationDatesToDelete) {
    await tx.applicationDate.delete({
      where: {
        applicationId_dateTypeId: {
          applicationId: parsedInputApplicationDates.applicationId,
          dateTypeId: dateToDelete,
        },
      },
    });
  }
}
