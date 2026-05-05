import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_ACTION_TYPES } from "../../constants";

export const deliverableActionTypeResolvers = {
  DeliverableActionType: generateCustomSetScalar(
    DELIVERABLE_ACTION_TYPES,
    "DeliverableActionType",
    "A string representing the type of action occurring to a deliverable."
  ),
};
