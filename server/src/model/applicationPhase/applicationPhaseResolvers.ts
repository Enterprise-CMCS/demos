import {
  ApplicationPhase as PrismaApplicationPhase,
  Document as PrismaDocument,
} from "@prisma/client";
import {
  ParsedApplicationDateInput,
  CompletePhaseInput,
  SetApplicationPhaseStatusInput,
} from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";

import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import {
  PhaseActionRecord,
  PrismaApplicationDateResults,
  startNextPhase,
  updatePhaseStatus,
  validatePhaseCompletion,
} from ".";
import { validateAndUpdateDates } from "../applicationDate";

const PHASE_ACTIONS: PhaseActionRecord = {
  Concept: {
    dateToComplete: "Concept Completion Date",
    nextPhase: {
      phaseName: "Application Intake",
      dateToStart: "Application Intake Start Date",
    },
  },
  "Application Intake": {
    dateToComplete: "Application Intake Completion Date",
    nextPhase: {
      phaseName: "Completeness",
      dateToStart: "Completeness Start Date",
    },
  },
  Completeness: {
    dateToComplete: "Completeness Completion Date",
    nextPhase: null,
  },
  "Federal Comment": "Not Permitted",
  "SDG Preparation": {
    dateToComplete: "SDG Preparation Completion Date",
    nextPhase: {
      phaseName: "OGC & OMB Review",
      dateToStart: "OGC & OMB Review Start Date",
    },
  },
  "OGC & OMB Review": {
    dateToComplete: "OGC & OMB Review Completion Date",
    nextPhase: {
      phaseName: "Approval Package",
      dateToStart: "Approval Package Start Date",
    },
  },
  "Approval Package": "Not Implemented",
  "Post Approval": "Not Implemented",
};

export async function __completePhase(
  _: unknown,
  { input }: { input: CompletePhaseInput }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API.`);
  } else if (phaseActions === "Not Implemented") {
    throw new Error(`Completion of the ${input.phaseName} phase via API is not yet implemented.`);
  }

  try {
    await prisma().$transaction(async (tx) => {
      await validatePhaseCompletion(input.applicationId, input.phaseName, tx);
      await updatePhaseStatus(input.applicationId, input.phaseName, "Completed", tx);

      const applicationDatesToUpdate: ParsedApplicationDateInput[] = [];
      applicationDatesToUpdate.push({
        dateType: phaseActions.dateToComplete,
        dateValue:
          easternNow[
            DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.dateToComplete].expectedTimestamp
          ],
      });

      if (phaseActions.nextPhase) {
        await startNextPhase(input.applicationId, phaseActions.nextPhase.phaseName, tx);
        applicationDatesToUpdate.push({
          dateType: phaseActions.nextPhase.dateToStart,
          dateValue:
            easternNow[
              DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.nextPhase.dateToStart]
                .expectedTimestamp
            ],
        });
      }

      await validateAndUpdateDates(
        { applicationId: input.applicationId, applicationDates: applicationDatesToUpdate },
        tx
      );
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export async function __setApplicationPhaseStatus(
  _: unknown,
  { input }: { input: SetApplicationPhaseStatusInput }
) {
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
    completePhase: __completePhase,
  },
};
