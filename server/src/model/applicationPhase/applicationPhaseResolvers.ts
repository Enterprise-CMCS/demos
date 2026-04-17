import {
  ApplicationPhase as PrismaApplicationPhase,
} from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  PrismaApplicationDateResults,
  completePhase,
  declareCompletenessPhaseIncomplete,
  skipConceptPhase,
} from ".";
import { PrismaApplicationNoteResults } from "./applicationPhaseTypes";
import { GraphQLContext } from "../../auth";
import { getManyDocuments } from "../document";

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
    documents: (parent: PrismaApplicationPhase, args: unknown, context: GraphQLContext) =>
      getManyDocuments(
        {
          applicationId: parent.applicationId,
          phaseId: parent.phaseId,
        },
        context.user
      ),
  },

  Mutation: {
    completePhase: completePhase,
    skipConceptPhase: skipConceptPhase,
    declareCompletenessPhaseIncomplete: declareCompletenessPhaseIncomplete,
  },
};
