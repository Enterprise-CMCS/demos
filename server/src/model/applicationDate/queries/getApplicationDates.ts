import { PrismaTransactionClient } from "../../../prismaClient.js";
import { DateType } from "../../../types.js";
import { ParsedApplicationDateInput } from "..";
import { parseJSDateToEasternTZDate } from "../../../dateUtilities.js";

export async function getApplicationDates(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<ParsedApplicationDateInput[]> {
  const result = await tx.applicationDate.findMany({
    select: {
      dateTypeId: true,
      dateValue: true,
    },
    where: {
      applicationId: applicationId,
    },
  });
  return result.map((row) => ({
    dateType: row.dateTypeId as DateType, // Enforced by database constraints
    dateValue: parseJSDateToEasternTZDate(row.dateValue),
  }));
}
