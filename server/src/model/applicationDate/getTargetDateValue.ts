import { DateType } from "../../types.js";
import { prisma } from "../../prismaClient.js";

export async function getTargetDateValue(applicationId: string, dateType: DateType): Promise<Date> {
  const result = await prisma().applicationDate.findUnique({
    select: {
      dateValue: true,
    },
    where: {
      applicationId_dateTypeId: {
        applicationId: applicationId,
        dateTypeId: dateType,
      },
    },
  });
  if (result === null) {
    throw new Error(
      `The date ${dateType} for application ${applicationId} was requested as part of a validation, but is undefined.`
    );
  }
  return result.dateValue;
}
