import { ApplicationPhase } from "@prisma/client";
import { getApplicationDatesForPhase } from "../applicationDate/applicationDateResolvers.js";

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
};
