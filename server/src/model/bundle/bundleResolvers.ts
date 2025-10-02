import { prisma } from "../../prismaClient";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { Bundle } from "@prisma/client";
import { BUNDLE_TYPES } from "../../constants";

export async function getBundle(bundleId: string) {
  const bundle = await prisma().bundle.findUnique({
    where: {
      id: bundleId,
    },
    select: {
      bundleTypeId: true,
    },
  });

  if (!bundle) {
    throw new Error(`Bundle with ID ${bundleId} not found`);
  }

  switch (bundle.bundleTypeId) {
    case "Demonstration":
      getDemonstration(undefined, { id: bundleId });
      break;
    case "Amendment":
      getAmendment(undefined, { id: bundleId });
      break;
    case "Extension":
      getExtension(undefined, { id: bundleId });
      break;
    default:
      throw new Error(`Unknown bundle type: ${bundle.bundleTypeId}`);
  }
}

export const bundleResolvers = {
  Bundle: {
    __resolveType: async (parent: Bundle) => {
      if (!(parent.bundleTypeId in BUNDLE_TYPES)) {
        throw new Error(`Unknown bundle type: ${parent.bundleTypeId}`);
      }
      return parent.bundleTypeId;
    },
  },
};
