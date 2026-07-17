// Vitest and other helpers
import { describe, expect, it, vi, beforeEach } from "vitest";

// Types
import type { AuthorizationClaims } from ".";

// Functions under test
import { validateClaims } from "./auth.util";

// Mock imports
vi.mock("../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import { log } from "../log";
import { throwCustomGQLError } from "../errors/errorCodes";

describe("validateClaims", () => {
  const validClaims: AuthorizationClaims = {
    sub: "sub-123",
    email: "user@example.com",
    role: "demos-admin",
    givenName: "Test",
    familyName: "User",
    externalUserId: "external-123",
    authTime: new Date(1779211277000),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not throw for valid claims", () => {
    const claims: AuthorizationClaims = { ...validClaims };

    expect(() => validateClaims(claims)).not.toThrow();
    expect(claims).toEqual(validClaims);
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it("logs and throws when email is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      email: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_EMAIL_ERROR: Authorizer claims missing required 'email' field.",
      "CLAIM_VALIDATION_EMAIL_ERROR"
    );
  });

  it("logs and throws when givenName is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      givenName: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_GIVEN_NAME_ERROR: Authorizer claims missing required 'given_name' field.",
      "CLAIM_VALIDATION_GIVEN_NAME_ERROR"
    );
  });

  it("logs and throws when familyName is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      familyName: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_FAMILY_NAME_ERROR: Authorizer claims missing required 'family_name' field.",
      "CLAIM_VALIDATION_FAMILY_NAME_ERROR"
    );
  });

  it("logs and throws when externalUserId is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      externalUserId: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_EXTERNAL_USER_ID_ERROR: Authorizer claims missing required 'externalUserId' field.",
      "CLAIM_VALIDATION_EXTERNAL_USER_ID_ERROR"
    );
  });

  it("logs and throws when sub is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      sub: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_SUB_ERROR: Authorizer claims missing required 'sub' field.",
      "CLAIM_VALIDATION_SUB_ERROR"
    );
  });

  it("logs and throws when role is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      role: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_ROLE_ERROR: Authorizer claims missing required 'role' field.",
      "CLAIM_VALIDATION_ROLE_ERROR"
    );
  });

  it("logs and throws when authTime is missing", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      authTime: undefined,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_AUTHTIME_ERROR: Authorizer claims missing required 'authTime' field.",
      "CLAIM_VALIDATION_AUTHTIME_ERROR"
    );
  });

  it("logs and throws when authTime is not a date", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      authTime: "not a date" as unknown as Date,
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_AUTHTIME_ERROR: Authorizer claims has non-Date instance of 'authTime' field.",
      "CLAIM_VALIDATION_AUTHTIME_ERROR"
    );
  });

  it("logs and throws when the date is invalid", () => {
    const claims: Partial<AuthorizationClaims> = {
      ...validClaims,
      authTime: new Date(NaN),
    };

    expect(() => validateClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Error Code CLAIM_VALIDATION_AUTHTIME_ERROR: Authorizer claims has invalid Date instance of 'authTime' field.",
      "CLAIM_VALIDATION_AUTHTIME_ERROR"
    );
  });
});
