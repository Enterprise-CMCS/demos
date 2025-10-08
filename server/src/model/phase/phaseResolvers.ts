import { generateCustomSetScalar } from "../../resolverFunctions.js";
import { PHASE_NAME } from "../../constants.js";

// Note: this is being called PhaseName to avoid confusion with phase-related objects
export const phaseResolvers = {
  PhaseName: generateCustomSetScalar(
    PHASE_NAME,
    "PhaseName",
    "A string representing a phase of an application."
  ),
};
