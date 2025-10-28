import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";
import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { APPLICATION_STATUS } from "../../constants.js";

export async function resolveApplicationStatus(
  parent: PrismaDemonstration | PrismaAmendment | PrismaExtension
) {
  return parent.statusId;
}

export const applicationStatusResolvers = {
  ApplicationStatus: generateCustomSetScalar(
    APPLICATION_STATUS,
    "ApplicationStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
};
