import {
  ApplicationPhase as PrismaApplicationPhase,
  Document as PrismaDocument,
} from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  PrismaApplicationDateResults,
  completePhase,
  declareCompletenessPhaseIncomplete,
  skipConceptPhase,
} from ".";
import { PrismaApplicationNoteResults } from "./applicationPhaseTypes.js";

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

export async function __resolveApplicationPhaseNotes(
  parent: PrismaApplicationPhase
): Promise<PrismaApplicationNoteResults[] | null> {
  const rows = await prisma().applicationNote.findMany({
    select: {
      noteTypeId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      applicationId: parent.applicationId,
      noteType: {
        phaseNoteTypes: {
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
    phaseNotes: __resolveApplicationPhaseNotes,
    documents: __resolveApplicationPhaseDocuments,
  },

  Mutation: {
    completePhase: completePhase,
    skipConceptPhase: skipConceptPhase,
    declareCompletenessPhaseIncomplete: declareCompletenessPhaseIncomplete,
  },
};
