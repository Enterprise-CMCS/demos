import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "..";

export async function upsertApplicationDates(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const dateUpdateOperations = parsedInputApplicationDates.applicationDatesToUpsert.map(
    (dateToUpdate) => {
      return tx.applicationDate.upsert({
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
  );
  await Promise.all(dateUpdateOperations);
}
