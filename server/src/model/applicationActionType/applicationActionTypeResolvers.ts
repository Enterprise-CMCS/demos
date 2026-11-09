import { generateCustomSetScalar } from "../../customScalarResolvers";
import { APPLICATION_ACTION_TYPES } from "../../constants";

export const applicationActionTypeResolvers = {
  ApplicationActionType: generateCustomSetScalar(
    APPLICATION_ACTION_TYPES,
    "ApplicationActionType",
    "A string representing the type of action occurring to an application."
  ),
};
