import { prisma } from "../../prismaClient.js";
import { DateType, SetApplicationDateInput, SetApplicationDatesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities";
import { startPhasesByDates } from "../applicationPhase";
import { validateAndUpdateDates } from ".";
import { ApplicationDate, ApplicationPhase, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export async function getApplicationDates(
  parent: ApplicationPhase,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<ApplicationDate[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.ApplicationDateWhereInput;

  switch (parentType) {
    case Prisma.ModelName.ApplicationPhase:
      filter = {
        applicationId: parent.applicationId,
        dateType: {
          phaseDateTypes: {
            some: { phaseId: (parent as Extract<typeof parent, ApplicationPhase>).phaseId },
          },
        },
      };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().applicationDate.findMany({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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

export const applicationDateResolvers = {
  Mutation: {
    setApplicationDate: __setApplicationDate,
    setApplicationDates: __setApplicationDates,
  },
  ApplicationDate: {
    dateType: (parent: ApplicationDate) => parent.dateTypeId,
  },
};
