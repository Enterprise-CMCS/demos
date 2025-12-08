import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ParsedSetApplicationDatesInput } from "..";

export async function deleteApplicationDates(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const dateDeleteOperations = parsedInputApplicationDates.applicationDatesToDelete.map(
    (dateToUpdate) => {
      return tx.applicationDate.delete({
        where: {
          applicationId_dateTypeId: {
            applicationId: parsedInputApplicationDates.applicationId,
            dateTypeId: dateToUpdate,
          },
        },
      });
    }
  );
  await Promise.all(dateDeleteOperations);
}
