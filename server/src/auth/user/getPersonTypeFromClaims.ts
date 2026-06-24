import { USER_TYPES } from "../../constants";
import { log } from "../../log";
import type { UserType } from "../../types";
import type { AuthorizationClaims } from "..";

export function getPersonTypeFromClaims(claims: AuthorizationClaims): UserType {
  const claimsRoles = new Set(claims.role.split(",").map((role) => role.trim()));
  const applicableRoles = USER_TYPES.filter((userType) => claimsRoles.has(userType));
  if (applicableRoles.length === 0) {
    const errorMessage = `User with cognito subject ${claims.sub} does not have any applicable roles`;
    log.error(errorMessage);
    throw new Error(errorMessage);
  } else if (applicableRoles.length > 1) {
    const errorMessage = `Claims with cognito subject ${claims.sub} has multiple applicable roles: ${applicableRoles.join(", ")}`;
    log.error(errorMessage);
    throw new Error(errorMessage);
  }

  return applicableRoles[0];
}
