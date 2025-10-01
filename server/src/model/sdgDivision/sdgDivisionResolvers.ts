import { generateCustomSetScalar } from "../../resolverFunctions.js";
import { SDG_DIVISIONS } from "../../constants.js";

export const sdgDivisionResolvers = {
  SdgDivision: generateCustomSetScalar(
    SDG_DIVISIONS,
    "SdgDivision",
    "A string representing a SDG division."
  ),
};
