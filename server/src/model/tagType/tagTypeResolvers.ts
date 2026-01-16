import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { TAG_TYPES } from "../../constants.js";

export const tagTypeResolvers = {
  TagType: generateCustomSetScalar(TAG_TYPES, "TagType", "A string representing a type of tag."),
};
