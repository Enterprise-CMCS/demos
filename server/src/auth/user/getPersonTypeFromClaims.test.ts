// Vitest and other helpers
import { describe, expect, it, vi, beforeEach } from "vitest";

// Types
import type { AuthorizationClaims } from "..";

// Functions under test
import { getPersonTypeFromClaims } from "./getPersonTypeFromClaims";

// Mock imports
vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import { log } from "../../log";
import { throwCustomGQLError } from "../../errors/errorCodes";

describe("getPersonTypeFromClaims", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("correctly extracts the person type from a single value", () => {
    const claims: AuthorizationClaims = {
      role: "demos-admin",
    } as AuthorizationClaims;

    const result = getPersonTypeFromClaims(claims);
    expect(result).toBe("demos-admin");
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it("correctly extracts the person type from multiple values", () => {
    const claims: AuthorizationClaims = {
      role: "demos-cms-user,unrelated-role1,unrelated-role2",
    } as AuthorizationClaims;

    const result = getPersonTypeFromClaims(claims);
    expect(result).toBe("demos-cms-user");
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it("logs and throws if role is empty", () => {
    const claims: AuthorizationClaims = {
      role: "",
    } as AuthorizationClaims;

    expect(() => getPersonTypeFromClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Error Code USER_NO_VALID_ROLES_ERROR: User with cognito subject ${claims.sub} does not have any applicable roles.`,
      "USER_NO_VALID_ROLES_ERROR"
    );
  });

  it("logs and throws if no applicable roles are found", () => {
    const claims: AuthorizationClaims = {
      role: "unrecognized-role",
    } as AuthorizationClaims;

    expect(() => getPersonTypeFromClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Error Code USER_NO_VALID_ROLES_ERROR: User with cognito subject ${claims.sub} does not have any applicable roles.`,
      "USER_NO_VALID_ROLES_ERROR"
    );
  });

  it("logs and throws if multiple applicable roles are found", () => {
    const claims: AuthorizationClaims = {
      role: "demos-admin,demos-cms-user",
    } as AuthorizationClaims;

    expect(() => getPersonTypeFromClaims(claims)).toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Error Code USER_MORE_THAN_ONE_VALID_ROLE_ERROR: Claims with cognito subject ${claims.sub} has multiple applicable roles: demos-admin, demos-cms-user.`,
      "USER_MORE_THAN_ONE_VALID_ROLE_ERROR"
    );
  });
});
