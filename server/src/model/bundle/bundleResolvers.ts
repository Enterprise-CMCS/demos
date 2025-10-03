import { prisma } from "../../prismaClient";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { Bundle } from "@prisma/client";

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
}

export const bundleResolvers = {
  Bundle: {
    __resolveType: async (parent: Bundle) => {
      return parent.bundleTypeId;
    },
  },
};
