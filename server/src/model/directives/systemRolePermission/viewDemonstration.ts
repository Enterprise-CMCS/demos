import { DirectiveConfiguration } from "../authenticationDirectiveTransformer";
import { getCheckAuthorization } from "./getValidateSystemRolePermission";

const name = "viewDemonstration";

const PERMISSION_NAME = "View Demonstration";

export const viewDemonstrationDirective: DirectiveConfiguration = {
  name,
  checkAuthorization: getCheckAuthorization(PERMISSION_NAME),
};
