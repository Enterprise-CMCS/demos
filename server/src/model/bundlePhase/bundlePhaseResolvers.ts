import { BundlePhase } from "@prisma/client";
import { getBundleDatesForPhase } from "../bundleDate/bundleDateResolvers.js";

export const bundlePhaseResolvers = {
  BundlePhase: {
    phaseName: (parent: BundlePhase) => {
      return parent.phaseId;
    },
    phaseStatus: (parent: BundlePhase) => {
      return parent.phaseStatusId;
    },
    phaseDates: async (parent: BundlePhase) => {
      return getBundleDatesForPhase(parent.bundleId, parent.phaseId);
    },
  },
};
