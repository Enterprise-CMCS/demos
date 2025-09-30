import { generateCustomSetScalar } from "../../resolverFunctions.js";
import { CMCS_DIVISION } from "../../constants.js";

export const cmcsDivisionResolvers = {
  CmcsDivision: generateCustomSetScalar(
    CMCS_DIVISION,
    "CmcsDivision",
    "A string representing a CMCS division."
  ),
};
