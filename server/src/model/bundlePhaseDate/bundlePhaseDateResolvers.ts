import { BundlePhaseDate } from "@prisma/client";

export const bundlePhaseDateResolvers = {
  BundlePhaseDate: {
    dateType: async (parent: BundlePhaseDate) => {
      return parent.dateTypeId;
    },
  },
};
