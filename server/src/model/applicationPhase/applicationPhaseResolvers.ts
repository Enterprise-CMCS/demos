import { ApplicationPhase } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { SetPhaseStateInput } from "../../types.js";
import { getApplicationDatesForPhase } from "../applicationDate/applicationDateResolvers.js";

export async function setPhaseState(
  _: undefined,
  { input }: { input: SetPhaseStateInput }
): Promise<ApplicationPhase> {
  try {
    return await prisma().applicationPhase.upsert({
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
}

export const applicationPhaseResolvers = {
  Mutation: {
    setPhaseState,
  },
  ApplicationPhase: {
    phaseName: (parent: ApplicationPhase) => {
      return parent.phaseId;
    },
    phaseStatus: (parent: ApplicationPhase) => {
      return parent.phaseStatusId;
    },
    phaseDates: async (parent: ApplicationPhase) => {
      return getApplicationDatesForPhase(parent.applicationId, parent.phaseId);
    },
  },
};
