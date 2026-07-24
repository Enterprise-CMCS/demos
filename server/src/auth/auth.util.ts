import { CustomInternalErrorCode, throwCustomGQLError } from "../errors/errorCodes";
import { log } from "../log";
import type { ContextUser } from "./user";
import { findOrCreateContextUserFromClaims } from "./user";
import { createLoaders, type Loaders } from "../loaders";

export interface GraphQLContext {
  user: ContextUser;
  /**
   * Per-request DataLoaders used to batch and de-duplicate database reads across
   * field resolvers (see `../loaders`). Always populated on the real request
   * path by {@link buildContextFromClaims}; optional so that unit-test contexts
   * that never exercise loader-backed resolvers need not construct them.
   */
  loaders?: Loaders;
}

export type AuthorizationClaims = {
  sub: string;
  email: string;
  role: string;
  givenName: string;
  familyName: string;
  externalUserId: string;
  authTime: Date;
};

export function validateClaims(
  claims: Partial<AuthorizationClaims>
): asserts claims is AuthorizationClaims {
  let errorMessage: string;
  let errorCode: CustomInternalErrorCode;
  if (!claims.email) {
    errorCode = "CLAIM_VALIDATION_EMAIL_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'email' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.givenName) {
    errorCode = "CLAIM_VALIDATION_GIVEN_NAME_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'given_name' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.familyName) {
    errorCode = "CLAIM_VALIDATION_FAMILY_NAME_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'family_name' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.externalUserId) {
    errorCode = "CLAIM_VALIDATION_EXTERNAL_USER_ID_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'externalUserId' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.sub) {
    errorCode = "CLAIM_VALIDATION_SUB_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'sub' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.role) {
    errorCode = "CLAIM_VALIDATION_ROLE_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'role' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
  if (!claims.authTime) {
    errorCode = "CLAIM_VALIDATION_AUTHTIME_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims missing required 'authTime' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  } else if (!(claims.authTime instanceof Date)) {
    errorCode = "CLAIM_VALIDATION_AUTHTIME_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims has non-Date instance of 'authTime' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  } else if (Number.isNaN(claims.authTime.getTime())) {
    errorCode = "CLAIM_VALIDATION_AUTHTIME_ERROR";
    errorMessage = `Error Code ${errorCode}: Authorizer claims has invalid Date instance of 'authTime' field.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, errorCode);
  }
}

export async function buildContextFromClaims(claims: AuthorizationClaims): Promise<GraphQLContext> {
  return {
    user: await findOrCreateContextUserFromClaims(claims),
    loaders: createLoaders(),
  };
}
