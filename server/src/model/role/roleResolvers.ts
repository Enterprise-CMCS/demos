import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { ROLES } from "../../constants.js";

export const roleResolvers = {
  Role: generateCustomSetScalar(ROLES, "Role", "A string representing a role in DEMOS."),
};
