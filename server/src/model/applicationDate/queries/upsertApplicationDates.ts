import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "../../../types.js";

export async function upsertApplicationDates(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const dateUpdateOperations = parsedInputApplicationDates.applicationDates.map((dateToUpdate) => {
    return tx.applicationDate.upsert({
      where: {
        applicationId_dateTypeId: {
          applicationId: parsedInputApplicationDates.applicationId,
          dateTypeId: dateToUpdate.dateType,
        },
      },
      update: {
        dateValue: dateToUpdate.dateValue,
      },
      create: {
        applicationId: parsedInputApplicationDates.applicationId,
        dateTypeId: dateToUpdate.dateType,
        dateValue: dateToUpdate.dateValue,
      },
    });
  });
  await Promise.all(dateUpdateOperations);
}
