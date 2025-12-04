import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetApplicationDateInput, SetApplicationDatesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateAndUpdateDates } from ".";
import { startPhaseOnDateUpdate } from "./startPhaseOnDateUpdate.js";

export function __setApplicationDate(
  _: unknown,
  { input }: { input: SetApplicationDateInput }
): Promise<PrismaApplication> {
  const payload: SetApplicationDatesInput = {
    applicationId: input.applicationId,
    applicationDates: [
      {
        dateType: input.dateType,
        dateValue: input.dateValue,
      },
    ],
  };
  return __setApplicationDates(undefined, { input: payload });
}

export async function __setApplicationDates(
  _: unknown,
  { input }: { input: SetApplicationDatesInput }
): Promise<PrismaApplication> {
  if (input.applicationDates.length === 0) {
    return await getApplication(input.applicationId);
  }
  try {
    await prisma().$transaction(async (tx) => {
      const phaseStartDates = await startPhaseOnDateUpdate(input, tx);

      // put all generated dates in a map
      const mergedDateMap = new Map(
        phaseStartDates.map((phaseStartDate) => [phaseStartDate.dateType, phaseStartDate])
      );
      // put all input dates in the map, overwriting any generated dates of the same type
      input.applicationDates.forEach((inputDate) =>
        mergedDateMap.set(inputDate.dateType, inputDate)
      );
      input.applicationDates = Array.from(mergedDateMap.values());

      await validateAndUpdateDates(input, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export function __resolveApplicationDateType(parent: PrismaApplicationDate): string {
  return parent.dateTypeId;
}

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDate: __setApplicationDate,
    setApplicationDates: __setApplicationDates,
  },
  ApplicationDate: {
    dateType: __resolveApplicationDateType,
  },
};
