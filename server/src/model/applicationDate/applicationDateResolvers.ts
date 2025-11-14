import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../prismaClient.js";
import {
  SetApplicationDateInput,
  SetApplicationDatesInput,
  ParsedSetApplicationDatesInput,
} from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  getExistingDates,
  mergeApplicationDates,
} from "./dateValidationPayloadCreationFunctions.js";
import { validateInputDates } from "./validateInputDates.js";
import { parseDateTimeOrLocalDateToJSDate } from "../../dateUtilities.js";

export function __parseInputApplicationDates(
  inputApplicationDates: SetApplicationDatesInput
): ParsedSetApplicationDatesInput {
  const result: ParsedSetApplicationDatesInput = {
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

export async function __changeDatesInTransaction(
  parsedInputApplicationDates: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const dateUpdateOperations = parsedInputApplicationDates.applicationDates.map((dateToUpdate) => {
    return tx.applicationDate.upsert({
      where: {
        applicationId_dateTypeId: {
          applicationId: parsedInputApplicationDates.applicationId,
          dateTypeId: dateToUpdate.dateType,
        },
      },
      update: {
        dateValue: dateToUpdate.dateValue,
      },
      create: {
        applicationId: parsedInputApplicationDates.applicationId,
        dateTypeId: dateToUpdate.dateType,
        dateValue: dateToUpdate.dateValue,
      },
    });
  });
  await Promise.all(dateUpdateOperations);
}

export async function validateAndUpdateDates(
  setApplicationDateInput: ParsedSetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const existingApplicationDates = await getExistingDates(
    setApplicationDateInput.applicationId,
    tx
  );
  const updatedApplicationDates = mergeApplicationDates(
    existingApplicationDates,
    setApplicationDateInput.applicationDates
  );
  validateInputDates(updatedApplicationDates);
  await __changeDatesInTransaction(setApplicationDateInput, tx);
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
    await prisma().$transaction(async (tx) => {
      const parsedInputApplicationDates = __parseInputApplicationDates(input);
      await validateAndUpdateDates(parsedInputApplicationDates, tx);
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
