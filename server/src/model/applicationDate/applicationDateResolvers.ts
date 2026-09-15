import { notifyApplicationDeemedComplete } from "../email/notifyApplicationEvent";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { DateType, SetApplicationDateInput, SetApplicationDatesInput } from "../../types";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getEasternNow } from "../../dateUtilities";
import { startPhasesByDates } from "../applicationPhase";
import { validateAndUpdateDates } from ".";

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
  parent: unknown,
  { input }: { input: SetApplicationDateInput },
  context: { user: { id: string } }
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
  return __setApplicationDates(undefined, { input: payload }, context);
}

export async function __setApplicationDates(
  parent: unknown,
  { input }: { input: SetApplicationDatesInput },
  context: { user: { id: string } }
): Promise<PrismaApplication> {
  if (input.applicationDates.length === 0) {
    return await getApplication(input.applicationId);
  }
  let deemedCompleteDate: Date | undefined;
  try {
    checkForDuplicateDateTypes(input);
    await prisma().$transaction(async (tx) => {
      const deemedCompleteInput = input.applicationDates.find(
        (date) => date.dateType === "State Application Deemed Complete" && date.dateValue !== null
      );
      if (deemedCompleteInput) {
        const existingDate = await tx.applicationDate.findUnique({
          where: {
            applicationId_dateTypeId: {
              applicationId: input.applicationId,
              dateTypeId: "State Application Deemed Complete",
            },
          },
        });
        const date = new Date(deemedCompleteInput.dateValue!);
        if (existingDate?.dateValue.getTime() !== date.getTime()) {
          deemedCompleteDate = date;
        }
      }
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
  const application = await getApplication(input.applicationId);
  if (deemedCompleteDate) {
    await notifyApplicationDeemedComplete(application, deemedCompleteDate, context.user.id);
  }
  return application;
}

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDate: __setApplicationDate,
    setApplicationDates: __setApplicationDates,
  },
  ApplicationDate: {
    dateType: (parent: PrismaApplicationDate): DateType => parent.dateTypeId as DateType,
  },
};
