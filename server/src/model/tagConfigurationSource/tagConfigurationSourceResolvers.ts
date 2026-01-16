import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { TAG_CONFIGURATION_SOURCES } from "../../constants.js";

export const tagConfigurationSourceResolvers = {
  TagConfigurationSource: generateCustomSetScalar(
    TAG_CONFIGURATION_SOURCES,
    "TagConfigurationSource",
    "A string representing the source of a tag."
  ),
};
