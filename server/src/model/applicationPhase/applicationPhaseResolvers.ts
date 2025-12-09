import {
  ApplicationPhase as PrismaApplicationPhase,
  Document as PrismaDocument,
} from "@prisma/client";
import { SetApplicationPhaseStatusInput } from "../../types.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  PrismaApplicationDateResults,
  completePhase,
  declareCompletenessPhaseIncomplete,
  skipConceptPhase,
} from ".";

export async function __setApplicationPhaseStatus(
  _: unknown,
  { input }: { input: SetApplicationPhaseStatusInput }
): Promise<PrismaApplication> {
  // Temporary fix until we eventually deprecate __setApplicationPhaseStatus
  if (input.phaseName === "Federal Comment") {
    throw new Error(`Operations against the Federal Comment phase are not permitted via API.`);
  } else if (input.phaseStatus === "Completed") {
    return await completePhase(_, {
      input: { applicationId: input.applicationId, phaseName: input.phaseName },
    });
  } else if (input.phaseName === "Concept" && input.phaseStatus === "Skipped") {
    return await skipConceptPhase(_, { applicationId: input.applicationId });
  } else if (input.phaseName === "Completeness" && input.phaseStatus === "Incomplete") {
    return await declareCompletenessPhaseIncomplete(_, { applicationId: input.applicationId });
  }

  try {
    await prisma().applicationPhase.upsert({
      where: {
        applicationId_phaseId: {
          applicationId: input.applicationId,
          phaseId: input.phaseName,
        },
      },
      update: {
        phaseStatusId: input.phaseStatus,
      },
      create: {
        applicationId: input.applicationId,
        phaseId: input.phaseName,
        phaseStatusId: input.phaseStatus,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export async function __resolveApplicationPhaseDates(
  parent: PrismaApplicationPhase
): Promise<PrismaApplicationDateResults[] | null> {
  const rows = await prisma().applicationDate.findMany({
    select: {
      dateTypeId: true,
      dateValue: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      applicationId: parent.applicationId,
      dateType: {
        phaseDateTypes: {
          some: { phaseId: parent.phaseId },
        },
      },
    },
  });
  return rows;
}

export async function __resolveApplicationPhaseDocuments(
  parent: PrismaApplicationPhase
): Promise<PrismaDocument[]> {
  return await prisma().document.findMany({
    where: {
      applicationId: parent.applicationId,
      phaseId: parent.phaseId,
    },
  });
}

export function __resolveApplicationPhaseName(parent: PrismaApplicationPhase): string {
  return parent.phaseId;
}

export function __resolveApplicationPhaseStatus(parent: PrismaApplicationPhase): string {
  return parent.phaseStatusId;
}

export const applicationPhaseResolvers = {
  ApplicationPhase: {
    phaseName: __resolveApplicationPhaseName,
    phaseStatus: __resolveApplicationPhaseStatus,
    phaseDates: __resolveApplicationPhaseDates,
    documents: __resolveApplicationPhaseDocuments,
  },

  Mutation: {
    setApplicationPhaseStatus: __setApplicationPhaseStatus,
    completePhase: completePhase,
    skipConceptPhase: skipConceptPhase,
    declareCompletenessPhaseIncomplete: declareCompletenessPhaseIncomplete,
  },
};
