import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DATE_TYPES } from "../../constants.js";

export const dateTypeResolvers = {
  DateType: generateCustomSetScalar(
    DATE_TYPES,
    "DateType",
    "A string representing a kind of date for a phase."
  ),
};
