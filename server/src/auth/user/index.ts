import type { Permission, UserType } from "../../types";

export { createNewUserFromClaims } from "./createNewUserFromClaims";
export { findUserByCognitoSubject } from "./findUserByCognitoSubject";
export { findOrCreateContextUserFromClaims } from "./userContext";
export { getPersonTypeFromClaims } from "./getPersonTypeFromClaims";

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
  permissions: Permission[];
};
