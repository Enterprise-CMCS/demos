import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetApplicationDateInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateInputDate } from "./validateInputDate.js";

export async function __setApplicationDate(
  _: undefined,
  { input }: { input: SetApplicationDateInput }
): Promise<PrismaApplication> {
  await validateInputDate(input);
  try {
    await prisma().applicationDate.upsert({
      where: {
        applicationId_dateTypeId: {
          applicationId: input.applicationId,
          dateTypeId: input.dateType,
        },
      },
      update: {
        dateValue: input.dateValue,
      },
      create: {
        applicationId: input.applicationId,
        dateTypeId: input.dateType,
        dateValue: input.dateValue,
      },
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
  },
  ApplicationDate: {
    dateType: __resolveApplicationDateType,
  },
};
