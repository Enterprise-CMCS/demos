import { prisma } from "../../prismaClient";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { Bundle } from "@prisma/client";
import { BUNDLE_TYPES } from "../../constants";
import { BundleType } from "../../types";

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
      return await getDemonstration(undefined, { id: bundleId });
    case "Amendment":
      return await getAmendment(undefined, { id: bundleId });
    case "Extension":
      return await getExtension(undefined, { id: bundleId });
  }
  throw new Error(`Error getting bundle. Unknown bundle type: ${bundle.bundleTypeId}`);
}

export const bundleResolvers = {
  Bundle: {
    __resolveType: async (parent: Bundle) => {
      if (!BUNDLE_TYPES.includes(parent.bundleTypeId as BundleType)) {
        throw new Error(`Error resolving type. Unknown bundle type: ${parent.bundleTypeId}`);
      }
      return parent.bundleTypeId;
    },
  },
};
