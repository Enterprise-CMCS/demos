import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { APPLICATION_STATUS } from "../../constants.js";

export const applicationStatusResolvers = {
  ApplicationStatus: generateCustomSetScalar(
    APPLICATION_STATUS,
    "ApplicationStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
};
