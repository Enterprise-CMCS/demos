import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetApplicationDateInput, SetApplicationDatesInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getExistingDates, mergeApplicationDates } from "./validationPayloadCreationFunctions.js";
import { validateInputDates } from "./validateInputDates.js";
import { parseDateTimeOrLocalDateToJSDate } from "../../dateUtilities.js";

export function __parseInputApplicationDates(
  inputApplicationDates: SetApplicationDatesInput
): SetApplicationDatesInput {
  const result: SetApplicationDatesInput = {
    applicationId: inputApplicationDates.applicationId,
    applicationDates: [],
  };
  for (const applicationDate of inputApplicationDates.applicationDates) {
    result.applicationDates.push({
      dateType: applicationDate.dateType,
      dateValue: parseDateTimeOrLocalDateToJSDate(
        applicationDate.dateValue,
        DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[applicationDate.dateType].expectedTimestamp
      ),
    });
  }
  return result;
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
  const inputApplicationDates = __parseInputApplicationDates(input);
  const existingApplicationDates = await getExistingDates(input.applicationId);
  const updatedApplicationDates = mergeApplicationDates(
    existingApplicationDates,
    inputApplicationDates.applicationDates
  );

  validateInputDates(updatedApplicationDates);

  const datesToUpdate = inputApplicationDates.applicationDates.map((dateToUpdate) =>
    prisma().applicationDate.upsert({
      where: {
        applicationId_dateTypeId: {
          applicationId: input.applicationId,
          dateTypeId: dateToUpdate.dateType,
        },
      },
      update: {
        dateValue: dateToUpdate.dateValue,
      },
      create: {
        applicationId: input.applicationId,
        dateTypeId: dateToUpdate.dateType,
        dateValue: dateToUpdate.dateValue,
      },
    })
  );

  try {
    await prisma().$transaction(datesToUpdate);
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
