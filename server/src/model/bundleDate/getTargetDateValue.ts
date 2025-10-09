import { DateType } from "../../types.js";
import { prisma } from "../../prismaClient.js";

export async function getTargetDateValue(bundleId: string, dateType: DateType): Promise<Date> {
  const result = await prisma().bundleDate.findUnique({
    select: {
      dateValue: true,
    },
    where: {
      bundleId_dateTypeId: {
        bundleId: bundleId,
        dateTypeId: dateType,
      },
    },
  });
  if (result === null) {
    throw new Error(
      `The date ${dateType} for bundle ${bundleId} was requested as part of a validation, but is undefined.`
    );
  }
  return result.dateValue;
}
