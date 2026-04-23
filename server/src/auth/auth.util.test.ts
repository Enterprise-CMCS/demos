import { describe, expect, it } from "vitest";
import type { AuthorizationClaims } from "./auth.util.js";
import { validateClaims } from "./auth.util.js";

describe("validateClaims", () => {
  const validClaims: AuthorizationClaims = {
    sub: "sub-123",
    email: "user@example.com",
    role: "demos-admin",
    givenName: "Test",
    familyName: "User",
    externalUserId: "external-123",
  };

  it("does not throw for valid claims", () => {
    const claims: Partial<AuthorizationClaims> = { ...validClaims };

    expect(() => validateClaims(claims)).not.toThrow();
    expect(claims).toEqual(validClaims);
  });

  it("throws when email is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      email: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(
      "Authorizer claims missing required 'email' field"
    );
  });

  it("throws when givenName is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      givenName: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(
      "Authorizer claims missing required 'given_name' field"
    );
  });

  it("throws when familyName is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      familyName: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(
      "Authorizer claims missing required 'family_name' field"
    );
  });

  it("throws when externalUserId is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      externalUserId: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(
      "Authorizer claims missing required 'externalUserId' field"
    );
  });

  it("throws when sub is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      sub: undefined,
    };

    expect(() => validateClaims(claims)).toThrow("Authorizer claims missing required 'sub' field");
  });

  it("throws when role is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      role: undefined,
    };

    expect(() => validateClaims(claims)).toThrow("Authorizer claims missing required 'role' field");
  });

  it("throws when role is invalid", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      role: "not-a-real-role",
    };

    expect(() => validateClaims(claims)).toThrow("Invalid user role: 'not-a-real-role'");
  });
});
