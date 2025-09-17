import { BundlePhaseDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { Phase, DateType } from "../../types.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handleError } from "../../errors/HandleError.js";

async function setPhaseDate(
  _: undefined,
  {
    bundleId,
    phase,
    dateType,
    dateValue,
  }: { bundleId: string; phase: Phase; dateType: DateType; dateValue: Date }
) {
  try {
    await prisma().bundlePhaseDate.upsert({
      where: {
        bundleId_phaseId_dateTypeId: {
          bundleId: bundleId,
          phaseId: phase,
          dateTypeId: dateType,
        },
      },
      update: {
        dateValue: dateValue,
      },
      create: {
        bundleId: bundleId,
        phaseId: phase,
        dateTypeId: dateType,
        dateValue: dateValue,
      },
    });
  } catch (error) {
    handleError(error);
  }
  return await getBundle(bundleId);
}

export const bundlePhaseDateResolvers = {
  Mutation: {
    setPhaseDate: setPhaseDate,
  },

  BundlePhaseDate: {
    dateType: async (parent: BundlePhaseDate) => {
      return parent.dateTypeId;
    },
  },
};
