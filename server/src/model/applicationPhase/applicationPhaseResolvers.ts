import { ApplicationPhase } from "@prisma/client";
import { getApplicationDatesForPhase } from "../applicationDate/applicationDateResolvers.js";
import { prisma } from "../../prismaClient.js";
import { SetApplicationPhaseStatusInput } from "./applicationPhaseSchema.js";
import { getApplication } from "../application/applicationResolvers.js";

export async function setApplicationPhaseStatus(
  _: undefined,
  { input }: { input: SetApplicationPhaseStatusInput }
) {
  // Validate input against completion rules before updating
  await prisma().applicationPhase.update({
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
  return await getApplication(input.applicationId);
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
  },

  Mutation: {
    setApplicationPhaseStatus: setApplicationPhaseStatus,
  },
};
