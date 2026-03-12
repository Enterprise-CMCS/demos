import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { TAG_STATUSES } from "../../constants.js";

export const tagStatusResolvers = {
  TagStatus: generateCustomSetScalar(
    TAG_STATUSES,
    "TagStatus",
    "A string representing the review status of a tag."
  ),
};
