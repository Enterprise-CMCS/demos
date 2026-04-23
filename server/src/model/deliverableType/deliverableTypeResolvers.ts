import { generateCustomSetScalar } from "../../customScalarResolvers";
import { DELIVERABLE_TYPES } from "../../constants";

export const deliverableTypeResolvers = {
  DeliverableType: generateCustomSetScalar(
    DELIVERABLE_TYPES,
    "DeliverableType",
    "A string representing the type of a deliverable."
  ),
};
