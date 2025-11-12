import { DateType, ParsedApplicationDateInput } from "../../types.js";
import { PrismaTransactionClient } from "../../prismaClient.js";

export async function getExistingDates(
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

export function mergeApplicationDates(
  existingDates: ParsedApplicationDateInput[],
  newDates: ParsedApplicationDateInput[]
): ParsedApplicationDateInput[] {
  const resultDateMap = new Map(
    existingDates.map((existingDate) => [existingDate.dateType, existingDate])
  );
  newDates.forEach((newDate) => resultDateMap.set(newDate.dateType, newDate));
  return Array.from(resultDateMap.values());
}
