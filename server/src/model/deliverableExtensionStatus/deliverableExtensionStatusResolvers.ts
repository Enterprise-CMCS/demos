import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_EXTENSION_STATUSES } from "../../constants";

export const deliverableExtensionStatusResolvers = {
  DeliverableExtensionStatus: generateCustomSetScalar(
    DELIVERABLE_EXTENSION_STATUSES,
    "DeliverableExtensionStatus",
    "A string representing the status of a deliverable extension request."
  ),
};
