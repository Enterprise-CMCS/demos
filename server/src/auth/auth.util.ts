import { USER_TYPES } from "../constants";
import { ContextUser, findOrCreateContextUserFromClaims } from "./userContext";
import { UserType } from "../types";

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
  if (!USER_TYPES.includes(claims.role as UserType)) {
    throw new Error(`Invalid user role: '${claims.role}'`);
  }
}

export async function buildContextFromClaims(claims: AuthorizationClaims): Promise<GraphQLContext> {
  return {
    user: await findOrCreateContextUserFromClaims(claims),
  };
}
