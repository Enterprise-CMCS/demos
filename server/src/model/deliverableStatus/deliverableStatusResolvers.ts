import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_STATUSES, FINAL_DELIVERABLE_STATUSES } from "../../constants";

export const deliverableStatusResolvers = {
  DeliverableStatus: generateCustomSetScalar(
    DELIVERABLE_STATUSES,
    "DeliverableStatus",
    "A string representing the status of a deliverable."
  ),
  FinalDeliverableStatus: generateCustomSetScalar(
    FINAL_DELIVERABLE_STATUSES,
    "FinalDeliverableStatus",
    "A string representing one of the three final statuses of a deliverable."
  ),
};
