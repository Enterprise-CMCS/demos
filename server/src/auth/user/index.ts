import type { Permission, UserType } from "../../types";

export { createNewUserFromClaims } from "./createNewUserFromClaims";
export { findNewlyMigratedUserByEmail } from "./findNewlyMigratedUserByEmail";
export { findOrCreateContextUserFromClaims } from "./userContext";
export { findUserByClaims } from "./findUserByClaims";
export { getPersonTypeFromClaims } from "./getPersonTypeFromClaims";
export { linkNewlyMigratedUserFromClaims } from "./linkNewlyMigratedUserFromClaims";

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
  permissions: Permission[];
};
