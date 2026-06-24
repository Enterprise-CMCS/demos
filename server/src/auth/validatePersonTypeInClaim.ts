import type { AuthorizationClaims } from ".";
import { getPersonTypeFromClaims } from "./user";

// Note: this is an extremely lightweight semantic wrapper
// It exists to clarify what is happening in the server when this is called
export function validatePersonTypeInClaim(claims: AuthorizationClaims): void {
  getPersonTypeFromClaims(claims);
}
