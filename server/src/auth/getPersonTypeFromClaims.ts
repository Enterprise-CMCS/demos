import { USER_TYPES } from "../constants";
import type { UserType } from "../types";
import type { AuthorizationClaims } from "./auth.util";

export function getPersonTypeFromClaims(claims: AuthorizationClaims): UserType {
  const claimsRoles = new Set(claims.role.split(",").map((role) => role.trim()));
  const applicableRoles = USER_TYPES.filter((userType) => claimsRoles.has(userType));
  if (applicableRoles.length === 0) {
    throw new Error(`User with cognito subject ${claims.sub} does not have any applicable roles`);
  } else if (applicableRoles.length > 1) {
    throw new Error(
      `Claims with cognito subject ${claims.sub} has multiple applicable roles: ${applicableRoles.join(", ")}`
    );
  }

  return applicableRoles[0];
}
