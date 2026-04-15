import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DELIVERABLE_TYPES } from "../../constants.js";

export const deliverableTypeResolvers = {
  DeliverableType: generateCustomSetScalar(
    DELIVERABLE_TYPES,
    "DeliverableType",
    "A string representing the type of a deliverable."
  ),
};
