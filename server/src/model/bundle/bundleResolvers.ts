import { prisma } from "../../prismaClient";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { BundleType } from "../../types.js";

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
