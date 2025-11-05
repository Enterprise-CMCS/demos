import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetApplicationDatesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
// import { validateInputDate } from "./validateInputDate.js";
import { getExistingDateSet, mergeDateSet } from "./dateSetCreationFunctions.js";
import { validateInputDates } from "./validateInputDate.js";

export async function __setApplicationDates(
  _: unknown,
  { input }: { input: SetApplicationDatesInput }
): Promise<PrismaApplication> {
  const existingApplicationDates = await getExistingDateSet(input.applicationId);
  const updatedApplicationDates = mergeDateSet(existingApplicationDates, input.applicationDates);
  await validateInputDates(updatedApplicationDates);

  if (input.applicationDates.length > 0) {
    const datesToUpdate = input.applicationDates.map((dateToUpdate) =>
      prisma().applicationDate.upsert({
        where: {
          applicationId_dateTypeId: {
            applicationId: input.applicationId,
            dateTypeId: dateToUpdate.dateTypeId,
          },
        },
        update: {
          dateValue: dateToUpdate.dateValue,
        },
        create: {
          applicationId: input.applicationId,
          dateTypeId: dateToUpdate.dateTypeId,
          dateValue: dateToUpdate.dateValue,
        },
      })
    );

    try {
      await prisma().$transaction(datesToUpdate);
    } catch (error) {
      handlePrismaError(error);
    }
  }
  return await getApplication(input.applicationId);
}

export function __resolveApplicationDateType(parent: PrismaApplicationDate): string {
  return parent.dateTypeId;
}

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDates: __setApplicationDates,
  },
  ApplicationDate: {
    dateType: __resolveApplicationDateType,
  },
};
