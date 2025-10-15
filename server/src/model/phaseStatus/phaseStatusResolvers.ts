import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PHASE_STATUS } from "../../constants.js";

export const phaseStatusResolvers = {
  PhaseStatus: generateCustomSetScalar(
    PHASE_STATUS,
    "PhaseStatus",
    "A string representing the status of a phase of an application."
  ),
};
