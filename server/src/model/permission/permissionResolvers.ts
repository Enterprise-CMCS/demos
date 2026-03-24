import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PERMISSIONS } from "../../constants.js";

export const permissionResolvers = {
  Permission: generateCustomSetScalar(
    PERMISSIONS,
    "Permission",
    "A string representing a permission required to access a field or operation."
  ),
};
