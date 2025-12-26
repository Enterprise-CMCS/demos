import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { CLEARANCE_LEVELS } from "../../constants.js";

export const clearanceLevelResolvers = {
  ClearanceLevel: generateCustomSetScalar(
    CLEARANCE_LEVELS,
    "ClearanceLevel",
    "A string representing a Clearance Level."
  ),
};
