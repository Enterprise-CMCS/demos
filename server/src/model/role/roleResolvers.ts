import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { ROLES, SYSTEM_ROLES } from "../../constants.js";

export const roleResolvers = {
  Role: generateCustomSetScalar(ROLES, "Role", "A string representing a role in DEMOS."),
  SystemRole: generateCustomSetScalar(
    SYSTEM_ROLES,
    "SystemRole",
    "A string representing a system role in DEMOS."
  ),
};
