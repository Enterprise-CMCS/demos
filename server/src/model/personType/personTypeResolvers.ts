import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PERSON_TYPES } from "../../constants.js";

export const personTypeResolvers = {
  PersonType: generateCustomSetScalar(
    PERSON_TYPES,
    "PersonType",
    "A string representing a person type."
  ),
};
