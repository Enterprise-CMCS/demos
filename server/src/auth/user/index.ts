import type { Permission, UserType } from "../../types";

export { createNewUserFromClaims } from "./createNewUserFromClaims";
export { findOrCreateContextUserFromClaims } from "./userContext";

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
  permissions: Permission[];
};
