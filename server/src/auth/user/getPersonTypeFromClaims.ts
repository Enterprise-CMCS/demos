import { USER_TYPES } from "../../constants";
import { log } from "../../log";
import type { UserType } from "../../types";
import type { AuthorizationClaims } from "..";
import { CustomInternalErrorCode, throwCustomGQLError } from "../../errors/errorCodes";

export function getPersonTypeFromClaims(claims: AuthorizationClaims): UserType {
  const claimsRoles = new Set(claims.role.split(",").map((role) => role.trim()));
  const applicableRoles = USER_TYPES.filter((userType) => claimsRoles.has(userType));
  let errorMessage: string;
  let errorCode: CustomInternalErrorCode;
  if (applicableRoles.length === 0) {
    errorCode = "USER_NO_VALID_ROLES_ERROR";
    errorMessage = `Error Code ${errorCode}: User with cognito subject ${claims.sub} does not have any applicable roles.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  } else if (applicableRoles.length > 1) {
    errorCode = "USER_MORE_THAN_ONE_VALID_ROLE_ERROR";
    errorMessage = `Error Code ${errorCode}: Claims with cognito subject ${claims.sub} has multiple applicable roles: ${applicableRoles.join(", ")}.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }

  return applicableRoles[0];
}
