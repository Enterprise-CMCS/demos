import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_EXTENSION_REASON_CODES } from "../../constants";

export const deliverableExtensionReasonCodeResolvers = {
  DeliverableExtensionReasonCode: generateCustomSetScalar(
    DELIVERABLE_EXTENSION_REASON_CODES,
    "DeliverableExtensionReasonCode",
    "A string representing the reason code for a deliverable extension request."
  ),
};
