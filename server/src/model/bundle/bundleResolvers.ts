import { prisma } from "../../prismaClient";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { Bundle } from "@prisma/client";
import { BundleType } from "../../types.js";

const demonstrationBundleTypeId: BundleType = "DEMONSTRATION";
const amendmentBundleTypeId: BundleType = "AMENDMENT";
const extensionBundleTypeId: BundleType = "EXTENSION";

export async function getBundle(bundleId: string) {
  const bundle = await prisma().bundle.findUnique({
    where: {
      id: bundleId,
    },
    select: {
      bundleType: true,
    },
  });
  const bundleTypeId: BundleType = bundle?.bundleType.id as BundleType;

  if (bundleTypeId === "DEMONSTRATION") {
    return getDemonstration(undefined, { id: bundleId });
  } else if (bundleTypeId === "AMENDMENT") {
    return getAmendment(undefined, { id: bundleId });
  } else if (bundleTypeId === "EXTENSION") {
    return getExtension(undefined, { id: bundleId });
  }
}

export const bundleResolvers = {
  Bundle: {
    __resolveType(obj: Bundle) {
      if (obj.bundleTypeId === demonstrationBundleTypeId) {
        return "Demonstration";
      } else if (obj.bundleTypeId === amendmentBundleTypeId) {
        return "Amendment";
      } else if (obj.bundleTypeId === extensionBundleTypeId) {
        return "Extension";
      }
    },
  },
};
