import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DELIVERABLE_STATUSES } from "../../constants.js";

export const deliverableStatusResolvers = {
  DeliverableStatus: generateCustomSetScalar(
    DELIVERABLE_STATUSES,
    "DeliverableStatus",
    "A string representing the status of a deliverable."
  ),
};
