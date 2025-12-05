import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { DateType, SetApplicationDateInput, SetApplicationDatesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateAndUpdateDates } from ".";
import { startPhasesByDates } from "./startPhasesByDates.js";
import { getEasternNow } from "../../dateUtilities.js";

export function checkForDuplicateDateTypes(input: SetApplicationDatesInput): void {
  const inputDateTypes = input.applicationDates.map((applicationDate) => applicationDate.dateType);
  const inputDateTypeCounts = new Map<DateType, number>();
  for (const dateType of inputDateTypes) {
    inputDateTypeCounts.set(dateType, (inputDateTypeCounts.get(dateType) || 0) + 1);
  }
  const duplicatedDateTypes: DateType[] = [];
  for (const [dateType, count] of inputDateTypeCounts) {
    if (count > 1) {
      duplicatedDateTypes.push(dateType);
    }
  }
  if (duplicatedDateTypes.length > 0) {
    throw new Error(
      `The input contained the same dateType more than once for ` +
        `these dateTypes: ${duplicatedDateTypes.join(", ")}.`
    );
  }
}

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
    checkForDuplicateDateTypes(input);
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
