import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType } from "../../../types";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";

export const queryApplicationDatesByDateTypes = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  dateTypes: DateType[]
): Promise<Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[]> => {
  return await tx.applicationDate.findMany({
    where: {
      applicationId: applicationId,
      dateTypeId: { in: dateTypes },
    },
    select: {
      dateTypeId: true,
      dateValue: true,
    },
  });
};
