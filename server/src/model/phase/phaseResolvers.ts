import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PHASE_NAMES } from "../../constants.js";

// Note: this is being called PhaseName to avoid confusion with phase-related objects
export const phaseResolvers = {
  PhaseName: generateCustomSetScalar(
    PHASE_NAMES,
    "PhaseName",
    "A string representing all possible values of phase name in the database."
  ),
};
