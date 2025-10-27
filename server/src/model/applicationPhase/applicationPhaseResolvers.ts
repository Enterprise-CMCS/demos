import { ApplicationPhase } from "@prisma/client";
import { getApplicationDatesForPhase } from "../applicationDate/applicationDateResolvers.js";
import { prisma } from "../../prismaClient.js";
import { SetApplicationPhaseStatusInput } from "./applicationPhaseSchema.js";

export async function setApplicationPhaseStatus(
  _: undefined,
  { input }: { input: SetApplicationPhaseStatusInput }
) {
  return await prisma().applicationPhase.update({
    where: {
      applicationId_phaseId: {
        applicationId: input.applicationId,
        phaseId: input.phaseName,
      },
    },
    data: {
      phaseStatusId: input.phaseStatus,
    },
  });
}

export const applicationPhaseResolvers = {
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
    application: async (parent: ApplicationPhase) => {
      return await prisma().application.findUnique({
        where: { id: parent.applicationId },
      });
    }
  },

  Mutation: {
    setApplicationPhaseStatus: setApplicationPhaseStatus,
  },
};
