import { prisma } from "../../prismaClient.js";
import { DateType, SetBundleDateInput } from "../../types.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { addDays } from "date-fns";

export async function getTargetDateValue(bundleId: string, dateType: DateType): Promise<Date> {
  const result = await prisma().bundleDate.findUnique({
    select: {
      dateValue: true,
    },
    where: {
      bundleId_dateTypeId: {
        bundleId: bundleId,
        dateTypeId: dateType,
      },
    },
  });
  if (result === null) {
    throw new Error(
      `The date ${dateType} for bundle ${bundleId} was requested as part of a validation, but is undefined.`
    );
  }
  return result.dateValue;
}

export async function checkInputDateGreaterThan(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  if (inputDate.dateValue <= targetResult) {
    throw new Error(
      `The input ${inputDate.dateType} must be greater than ${targetDate.dateType}, which is ${targetResult}.`
    );
  }
}

export async function checkInputDateGreaterThanOrEqual(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  if (inputDate.dateValue < targetResult) {
    throw new Error(
      `The input ${inputDate.dateType} must be greater than or equal to ${targetDate.dateType}, which is ${targetResult}.`
    );
  }
}

export async function checkInputDateMeetsOffset(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
    offsetDays: number;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  const offsetDateValue = addDays(targetResult, targetDate.offsetDays);
  if (inputDate.dateValue.valueOf() !== offsetDateValue.valueOf()) {
    throw new Error(
      `The input ${inputDate.dateType} must be equal to ${targetDate.dateType} + ${targetDate.offsetDays}, which is ${offsetDateValue}.`
    );
  }
}

export async function validateInputDate(input: SetBundleDateInput): Promise<void> {
  const inputDate = {
    dateType: input.dateType,
    dateValue: new Date(input.dateValue),
  };

  switch (input.dateType) {
    case "Concept Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Start Date",
      });
      break;
    case "State Application Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Completion Date",
      });
      break;
    case "Completeness Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Completeness Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Completion Date",
      });
      break;
    case "State Application Deemed Complete":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
      });
      break;
    case "Completeness Review Due Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
        offsetDays: 15,
      });
      break;
    case "Federal Comment Period Start Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Deemed Complete",
        offsetDays: 1,
      });
      break;
    case "Federal Comment Period End Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "Federal Comment Period Start Date",
        offsetDays: 30,
      });
      break;
    default:
      break;
  }
}

export async function setBundleDate(_: undefined, { input }: { input: SetBundleDateInput }) {
  await validateInputDate(input);
  try {
    await prisma().bundleDate.upsert({
      where: {
        bundleId_dateTypeId: {
          bundleId: input.bundleId,
          dateTypeId: input.dateType,
        },
      },
      update: {
        dateValue: input.dateValue,
      },
      create: {
        bundleId: input.bundleId,
        dateTypeId: input.dateType,
        dateValue: input.dateValue,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getBundle(input.bundleId);
}

export async function getBundleDatesForPhase(bundleId: string, phaseId: string) {
  const rows = await prisma().bundleDate.findMany({
    select: {
      dateTypeId: true,
      dateValue: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      bundleId: bundleId,
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

export const bundleDateResolvers = {
  Mutation: {
    setBundleDate: setBundleDate,
  },
};
