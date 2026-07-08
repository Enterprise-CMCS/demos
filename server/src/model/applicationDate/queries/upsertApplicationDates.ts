import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "..";
import { formatEasternTZDateToISODate } from "../../../dateUtilities.js";

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
        plainDate: formatEasternTZDateToISODate(dateToUpdate.dateValue),
      },
      create: {
        applicationId: parsedInputApplicationDates.applicationId,
        dateTypeId: dateToUpdate.dateType,
        dateValue: dateToUpdate.dateValue.easternTZDate,
        plainDate: formatEasternTZDateToISODate(dateToUpdate.dateValue),
      },
    });
  }
}
