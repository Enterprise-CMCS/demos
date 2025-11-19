import { PrismaTransactionClient } from "../../../prismaClient.js";
import { DateType, ParsedApplicationDateInput } from "../../../types.js";

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
    dateValue: row.dateValue,
  }));
}
