import { getCheckAuthorization } from "./getValidateSystemRolePermission";

const name = "viewDemonstration";

const PERMISSION_NAME = "View Demonstration";

export const viewDemonstrationDirective = {
  name,
  checkAuthorization: getCheckAuthorization(PERMISSION_NAME),
} as const;
