import {
  ApplicationPhase as PrismaApplicationPhase,
  ApplicationDate as PrismaApplicationDate,
  Document as PrismaDocument,
} from "@prisma/client";
import { ParsedApplicationDateInput, DateType, PhaseName, PhaseStatus } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { prisma, PrismaTransactionClient } from "../../prismaClient.js";
import { CompletePhaseInput, SetApplicationPhaseStatusInput } from "./applicationPhaseSchema.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import { validateAndUpdateDates } from "../applicationDate/applicationDateResolvers.js";

type PhaseActions = {
  dateToComplete: DateType;
  nextPhase: {
    phaseName: PhaseName;
    dateToStart: DateType;
  } | null;
};
type PhaseActionRecord = Record<PhaseName, PhaseActions | "Not Implemented" | "Not Permitted">;

const PHASE_ACTIONS: PhaseActionRecord = {
  None: "Not Permitted",
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

async function __getExistingPhaseStatus(
  applicationId: string,
  phaseName: PhaseName,
  tx: PrismaTransactionClient
): Promise<PhaseStatus> {
  const result = await tx.applicationPhase.findUnique({
    select: {
      phaseStatusId: true,
    },
    where: {
      applicationId_phaseId: {
        applicationId: applicationId,
        phaseId: phaseName,
      },
    },
  });
  return result!.phaseStatusId as PhaseStatus; // Guaranteed type and existence in DB
}

async function __changePhaseStatusInTransaction(
  applicationId: string,
  phaseName: PhaseName,
  phaseStatus: PhaseStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.applicationPhase.update({
    where: {
      applicationId_phaseId: {
        applicationId: applicationId,
        phaseId: phaseName,
      },
    },
    data: {
      phaseStatusId: phaseStatus,
    },
  });
}

async function __completePhase(
  _: unknown,
  { input }: { input: CompletePhaseInput }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API`);
  } else if (phaseActions === "Not Implemented") {
    throw new Error(`Completion of the ${input.phaseName} phase via API is not yet implemented`);
  }

  try {
    await prisma().$transaction(async (tx) => {
      const currentPhaseStatus = await __getExistingPhaseStatus(
        input.applicationId,
        input.phaseName,
        tx
      );
      if (currentPhaseStatus !== "Started") {
        throw new Error(
          `${input.phaseName} phase for application ${input.applicationId} ` +
            `has status ${currentPhaseStatus}; cannot complete a phase unless it has status of Started.`
        );
      }
      await __changePhaseStatusInTransaction(input.applicationId, input.phaseName, "Completed", tx);

      const applicationDatesToUpdate: ParsedApplicationDateInput[] = [];
      applicationDatesToUpdate.push({
        dateType: phaseActions.dateToComplete,
        dateValue:
          easternNow[
            DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.dateToComplete].expectedTimestamp
          ],
      });
      if (phaseActions.nextPhase) {
        const nextPhaseStatus = await __getExistingPhaseStatus(
          input.applicationId,
          phaseActions.nextPhase.phaseName,
          tx
        );
        if (nextPhaseStatus === "Not Started") {
          await __changePhaseStatusInTransaction(
            input.applicationId,
            phaseActions.nextPhase.phaseName,
            "Started",
            tx
          );
          applicationDatesToUpdate.push({
            dateType: phaseActions.nextPhase.dateToStart,
            dateValue:
              easternNow[
                DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.nextPhase.dateToStart]
                  .expectedTimestamp
              ],
          });
        }
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

type PrismaApplicationDateResults = Pick<
  PrismaApplicationDate,
  "dateTypeId" | "dateValue" | "createdAt" | "updatedAt"
>;

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
