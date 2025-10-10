import { Demonstration, Modification } from "@prisma/client";
import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { BUNDLE_STATUS } from "../../constants.js";

export async function resolveBundleStatus(parent: Demonstration | Modification) {
  return parent.statusId;
}

export const bundleStatusResolvers = {
  BundleStatus: generateCustomSetScalar(
    BUNDLE_STATUS,
    "BundleStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
};
