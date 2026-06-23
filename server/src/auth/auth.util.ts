import { ContextUser, findOrCreateContextUserFromClaims } from "./user";

export interface GraphQLContext {
  user: ContextUser;
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
  if (!claims.email) {
    throw new Error("Authorizer claims missing required 'email' field");
  }
  if (!claims.givenName) {
    throw new Error("Authorizer claims missing required 'given_name' field");
  }
  if (!claims.familyName) {
    throw new Error("Authorizer claims missing required 'family_name' field");
  }
  if (!claims.externalUserId) {
    throw new Error("Authorizer claims missing required 'externalUserId' field");
  }
  if (!claims.sub) {
    throw new Error("Authorizer claims missing required 'sub' field");
  }
  if (!claims.role) {
    throw new Error("Authorizer claims missing required 'role' field");
  }
  if (!claims.authTime) {
    throw new Error("Authorizer claims missing required 'authTime' field");
  } else if (!(claims.authTime instanceof Date)) {
    throw new TypeError("Authorizer claims has non-Date instance of 'authTime' field");
  } else if (Number.isNaN(claims.authTime.getTime())) {
    throw new TypeError("Authorizer claims has invalid Date instance of 'authTime' field");
  }
}

export async function buildContextFromClaims(claims: AuthorizationClaims): Promise<GraphQLContext> {
  return {
    user: await findOrCreateContextUserFromClaims(claims),
  };
}
