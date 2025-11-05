import {
  ApplicationPhase as PrismaApplicationPhase,
  ApplicationDate as PrismaApplicationDate,
  Document as PrismaDocument,
} from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetApplicationPhaseStatusInput } from "./applicationPhaseSchema.js";
import { getApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

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
  },
};
