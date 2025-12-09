import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { SetApplicationDateInput, SetApplicationDatesInput } from "../../types";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getEasternNow } from "../../dateUtilities";
import { getApplication, PrismaApplication } from "../application/applicationResolvers";
import { startPhasesByDates } from "../applicationPhase";
import { validateAndUpdateDates } from ".";

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
      const easternNow = getEasternNow();
      const phaseStartDates = await startPhasesByDates(
        tx,
        input.applicationId,
        input.applicationDates,
        easternNow
      );

      input.applicationDates.push(...phaseStartDates);
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
