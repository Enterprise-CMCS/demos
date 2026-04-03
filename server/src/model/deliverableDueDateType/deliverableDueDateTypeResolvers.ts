import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DELIVERABLE_DUE_DATE_TYPES } from "../../constants.js";

export const deliverableDueDateTypeResolvers = {
  DeliverableStatus: generateCustomSetScalar(
    DELIVERABLE_DUE_DATE_TYPES,
    "DeliverableDueDateType",
    "A string representing the type of due date for a deliverable."
  ),
};
