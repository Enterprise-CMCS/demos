import { getCheckAuthorization } from "./getValidateSystemRolePermission";

const name = "viewApplication";

const PERMISSION_NAME = "View Application";

export const viewApplicationDirective = {
  name,
  checkAuthorization: getCheckAuthorization(PERMISSION_NAME),
} as const;
