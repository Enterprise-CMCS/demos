import type { Permission, UserType } from "../../types";

export { createNewUserFromClaims } from "./createNewUserFromClaims";
export { findUserByClaims } from "./findUserByClaims";
export { findOrCreateContextUserFromClaims } from "./userContext";
export { getPersonTypeFromClaims } from "./getPersonTypeFromClaims";

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
  permissions: Permission[];
};
