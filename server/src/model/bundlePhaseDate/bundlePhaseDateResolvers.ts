import { BundlePhaseDate } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { SetPhaseDateInput } from "../../types.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

async function setPhaseDate(_: undefined, { input }: { input: SetPhaseDateInput }) {
  try {
    await prisma().bundlePhaseDate.upsert({
      where: {
        bundleId_phaseId_dateTypeId: {
          bundleId: input.bundleId,
          phaseId: input.phaseName,
          dateTypeId: input.dateType,
        },
      },
      update: {
        dateValue: input.dateValue,
      },
      create: {
        bundleId: input.bundleId,
        phaseId: input.phaseName,
        dateTypeId: input.dateType,
        dateValue: input.dateValue,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getBundle(input.bundleId);
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
