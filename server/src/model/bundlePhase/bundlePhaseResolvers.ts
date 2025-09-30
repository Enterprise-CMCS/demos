import { BundlePhase } from "@prisma/client";
import { prisma } from "../../prismaClient.js";

export const bundlePhaseResolvers = {
  BundlePhase: {
    phaseName: async (parent: BundlePhase) => {
      return parent.phaseId;
    },
    phaseStatus: async (parent: BundlePhase) => {
      return parent.phaseStatusId;
    },
    phaseDates: async (parent: BundlePhase) => {
      return await prisma().bundlePhaseDate.findMany({
        where: {
          bundleId: parent.bundleId,
          phaseId: parent.phaseId,
        },
      });
    },
  },
};
