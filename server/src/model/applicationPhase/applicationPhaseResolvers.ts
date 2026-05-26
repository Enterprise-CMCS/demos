import {
  ApplicationNote as PrismaApplicationNote,
  ApplicationDate as PrismaApplicationDate,
  ApplicationPhase as PrismaApplicationPhase,
  Document as PrismaDocument,
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
import { selectManyApplicationDates } from "../applicationDate/queries";
import { selectManyApplicationNotes } from "../applicationNote/queries";
import { PhaseName } from "../../constants";
import { PhaseStatus } from "../../types";

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

export const applicationPhaseResolvers = {
  ApplicationPhase: {
    phaseName: (parent: PrismaApplicationPhase): PhaseName => parent.phaseId as PhaseName,
    phaseStatus: (parent: PrismaApplicationPhase): PhaseStatus =>
      parent.phaseStatusId as PhaseStatus,
    phaseDates: (parent: PrismaApplicationPhase): Promise<PrismaApplicationDate[]> =>
      selectManyApplicationDates({
        applicationId: parent.applicationId,
        dateType: {
          phaseDateTypes: {
            some: { phaseId: parent.phaseId },
          },
        },
      }),
    phaseNotes: (parent: PrismaApplicationPhase): Promise<PrismaApplicationNote[]> =>
      selectManyApplicationNotes({
        applicationId: parent.applicationId,
        noteType: {
          phaseNoteTypes: {
            some: { phaseId: parent.phaseId },
          },
        },
      }),
    documents: (
      parent: PrismaApplicationPhase,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      getManyDocuments(
        {
          applicationId: parent.applicationId,
          phaseId: parent.phaseId,
        },
        context.user
      ),
  },

  Mutation: {
    completePhase,
    skipConceptPhase,
    declareCompletenessPhaseIncomplete,
  },
};
