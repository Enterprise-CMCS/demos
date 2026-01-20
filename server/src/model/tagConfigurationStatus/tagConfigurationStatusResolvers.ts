import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { TAG_CONFIGURATION_STATUSES } from "../../constants.js";

export const tagConfigurationStatusResolvers = {
  TagConfigurationStatus: generateCustomSetScalar(
    TAG_CONFIGURATION_STATUSES,
    "TagConfigurationStatus",
    "A string representing the review status of a tag."
  ),
};
