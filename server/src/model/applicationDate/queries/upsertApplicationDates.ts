import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "..";

export async function upsertApplicationDates(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  for (const dateToUpdate of parsedInputApplicationDates.applicationDatesToUpsert) {
    await tx.applicationDate.upsert({
      where: {
        applicationId_dateTypeId: {
          applicationId: parsedInputApplicationDates.applicationId,
          dateTypeId: dateToUpdate.dateType,
        },
      },
      update: {
        dateValue: dateToUpdate.dateValue.easternTZDate,
      },
      create: {
        applicationId: parsedInputApplicationDates.applicationId,
        dateTypeId: dateToUpdate.dateType,
        dateValue: dateToUpdate.dateValue.easternTZDate,
      },
    });
  }
}
