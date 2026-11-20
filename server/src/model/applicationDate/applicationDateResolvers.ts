import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { DateType, SetApplicationDateInput, SetApplicationDatesInput } from "../../types";
import { GraphQLContext } from "../../auth";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { formatDateToPlainDate, getEasternNow } from "../../dateUtilities";
import { startPhasesByDates } from "../applicationPhase";
import { validateAndUpdateDates } from ".";
import { __DEMOS_VERSION__ } from "../../flags";
import { insertApplicationAction } from "../applicationAction/queries";

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
  context: GraphQLContext
): Promise<PrismaApplication> {
  const payload: SetApplicationDatesInput = {
    applicationId: input.applicationId,
    applicationDates: [
      {
        dateType: input.dateType,
        plainDate: input.plainDate,
      },
    ],
  };
  return __setApplicationDates(undefined, { input: payload }, context);
}

export async function __setApplicationDates(
  parent: unknown,
  { input }: { input: SetApplicationDatesInput },
  context: GraphQLContext
): Promise<PrismaApplication> {
  if (input.applicationDates.length === 0) {
    return await getApplication(input.applicationId);
  }
  try {
    checkForDuplicateDateTypes(input);
    await prisma().$transaction(async (tx) => {
      for (const applicationDate of input.applicationDates) {
        await insertApplicationAction(
          {
            applicationId: input.applicationId,
            actionType:
              applicationDate.plainDate === null
                ? "Deleted Application Date"
                : "Set Application Date",
            dateType: applicationDate.dateType,
            userId: context.user.id,
          },
          tx
        );
      }

      const easternNow = getEasternNow();
      const phaseStartDates = await startPhasesByDates(
        tx,
        input.applicationId,
        input.applicationDates,
        easternNow
      );

      input.applicationDates.push(...phaseStartDates);
      await validateAndUpdateDates(input, tx, __DEMOS_VERSION__);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDate: __setApplicationDate,
    setApplicationDates: __setApplicationDates,
  },
  ApplicationDate: {
    dateType: (parent: PrismaApplicationDate): DateType => parent.dateTypeId as DateType,
    plainDate: (parent: PrismaApplicationDate): string => formatDateToPlainDate(parent.dateValue),
  },
};
