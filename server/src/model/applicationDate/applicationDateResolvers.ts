import { prisma } from "../../prismaClient.js";
import { SetApplicationDateInput } from "../../types.js";
import { getApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateInputDate } from "./validateInputDate.js";

export async function setApplicationDate(
  _: undefined,
  { input }: { input: SetApplicationDateInput }
) {
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

export async function getApplicationDatesForPhase(applicationId: string, phaseId: string) {
  const rows = await prisma().applicationDate.findMany({
    select: {
      dateTypeId: true,
      dateValue: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      applicationId: applicationId,
      dateType: {
        phaseDateTypes: {
          some: { phaseId: phaseId },
        },
      },
    },
  });
  return rows.map((row) => ({
    dateType: row.dateTypeId,
    dateValue: row.dateValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDate: setApplicationDate,
  },
};
