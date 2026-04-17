import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_DUE_DATE_TYPES } from "../../constants";

export const deliverableDueDateTypeResolvers = {
  DeliverableStatus: generateCustomSetScalar(
    DELIVERABLE_DUE_DATE_TYPES,
    "DeliverableDueDateType",
    "A string representing the type of due date for a deliverable."
  ),
};
