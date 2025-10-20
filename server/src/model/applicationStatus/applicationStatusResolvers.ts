import { Demonstration, Modification } from "@prisma/client";
import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { APPLICATION_STATUS } from "../../constants.js";

export function resolveApplicationStatus(parent: Demonstration | Modification) {
  return parent.statusId;
}

export const applicationStatusResolvers = {
  ApplicationStatus: generateCustomSetScalar(
    APPLICATION_STATUS,
    "ApplicationStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
};
