import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PHASE_NAME, PHASE_NAMES_WITH_TRACKED_STATUS } from "../../constants.js";

// Note: this is being called PhaseName to avoid confusion with phase-related objects
export const phaseResolvers = {
  PhaseName: generateCustomSetScalar(
    PHASE_NAME,
    "PhaseName",
    "A string representing all possible values of phase name in the database. " +
      "This includes None, which is not a phase with a tracked status."
  ),
  PhaseNameWithTrackedStatus: generateCustomSetScalar(
    PHASE_NAMES_WITH_TRACKED_STATUS,
    "PhaseNameWithTrackedStatus",
    "A string representing phase names where the phase status is actually tracked. " +
      "This excludes None, which is not a phase with a tracked status."
  ),
};
