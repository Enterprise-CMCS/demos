import { generateCustomSetScalar } from "../../resolverFunctions.js";
import { PHASE } from "../../constants.js";

export const phaseResolvers = {
  Phase: generateCustomSetScalar(
    PHASE,
    "Phase",
    "A string representing a phase of an application."
  ),
};
