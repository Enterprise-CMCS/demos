import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_STATUSES } from "../../constants";

export const deliverableStatusResolvers = {
  DeliverableStatus: generateCustomSetScalar(
    DELIVERABLE_STATUSES,
    "DeliverableStatus",
    "A string representing the status of a deliverable."
  ),
};
