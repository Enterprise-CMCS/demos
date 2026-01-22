import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DEMONSTRATION_TYPE_STATUSES } from "../../constants.js";

export const demonstrationTypeTagAssignmentResolvers = {
  DemonstrationTypeStatus: generateCustomSetScalar(
    DEMONSTRATION_TYPE_STATUSES,
    "DemonstrationTypeStatus",
    "A string representing the status of a demonstration type."
  ),
};
