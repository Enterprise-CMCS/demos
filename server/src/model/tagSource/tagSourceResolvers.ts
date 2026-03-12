import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { TAG_SOURCES } from "../../constants.js";

export const tagSourceResolvers = {
  TagSource: generateCustomSetScalar(
    TAG_SOURCES,
    "TagSource",
    "A string representing the source of a tag."
  ),
};
