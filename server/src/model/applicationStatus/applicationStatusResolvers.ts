import { Demonstration, Amendment, Extension } from "@prisma/client";
import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { APPLICATION_STATUS } from "../../constants.js";

export async function resolveApplicationStatus(parent: Demonstration | Amendment | Extension) {
  return parent.statusId;
}

export const applicationStatusResolvers = {
  ApplicationStatus: generateCustomSetScalar(
    APPLICATION_STATUS,
    "ApplicationStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
};
