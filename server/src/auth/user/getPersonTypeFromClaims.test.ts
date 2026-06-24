import { describe, expect, it } from "vitest";
import type { AuthorizationClaims } from "..";
import { getPersonTypeFromClaims } from "./getPersonTypeFromClaims";

describe("getPersonTypeFromClaims", () => {
  it("correctly extracts the person type from a single value", async () => {
    const claims: AuthorizationClaims = {
      role: "demos-admin",
    } as AuthorizationClaims;

    const result = getPersonTypeFromClaims(claims);
    expect(result).toBe("demos-admin");
  });

  it("correctly extracts the person type from multiple values", async () => {
    const claims: AuthorizationClaims = {
      role: "demos-cms-user,unrelated-role1,unrelated-role2",
    } as AuthorizationClaims;

    const result = getPersonTypeFromClaims(claims);
    expect(result).toBe("demos-cms-user");
  });

  it("throws an error if role is empty", async () => {
    const claims: AuthorizationClaims = {
      role: "",
    } as AuthorizationClaims;

    expect(() => getPersonTypeFromClaims(claims)).toThrow(
      `User with cognito subject ${claims.sub} does not have any applicable roles`
    );
  });

  it("throws an error if no applicable roles are found", async () => {
    const claims: AuthorizationClaims = {
      role: "unrecognized-role",
    } as AuthorizationClaims;

    expect(() => getPersonTypeFromClaims(claims)).toThrow(
      `User with cognito subject ${claims.sub} does not have any applicable roles`
    );
  });

  it("throws an error if multiple applicable roles are found", async () => {
    const claims: AuthorizationClaims = {
      role: "demos-admin,demos-cms-user",
    } as AuthorizationClaims;
    expect(() => getPersonTypeFromClaims(claims)).toThrow(
      `Claims with cognito subject ${claims.sub} has multiple applicable roles: demos-admin, demos-cms-user`
    );
  });
});
