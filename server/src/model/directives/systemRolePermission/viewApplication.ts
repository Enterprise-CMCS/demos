import { DirectiveConfiguration } from "../authenticationDirectiveTransformer";
import { getCheckAuthorization } from "./getValidateSystemRolePermission";

const name = "viewApplication";

const PERMISSION_NAME = "View Application";

export const viewApplicationDirective: DirectiveConfiguration = {
  name,
  checkAuthorization: getCheckAuthorization(PERMISSION_NAME),
};
