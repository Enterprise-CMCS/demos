import { ApplicationDateInput, DateType } from "../../types.js";
import { prisma } from "../../prismaClient.js";

export async function getExistingDates(applicationId: string): Promise<ApplicationDateInput[]> {
  const result = await prisma().applicationDate.findMany({
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
  existingDates: ApplicationDateInput[],
  newDates: ApplicationDateInput[]
): ApplicationDateInput[] {
  const resultDateMap = new Map(
    existingDates.map((existingDate) => [existingDate.dateType, existingDate])
  );
  newDates.forEach((newDate) => resultDateMap.set(newDate.dateType, newDate));
  return Array.from(resultDateMap.values());
}
