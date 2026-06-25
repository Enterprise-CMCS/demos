// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { AuthorizationClaims } from ".";

// Functions under test
import { validatePersonTypeInClaim } from "./validatePersonTypeInClaim";

// Mock imports
vi.mock("./user", () => ({
  getPersonTypeFromClaims: vi.fn(),
}));

import { getPersonTypeFromClaims } from "./user";

describe("validatePersonTypeInClaim", () => {
  // Test inputs
  const testClaims: Partial<AuthorizationClaims> = {
    sub: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate the person type from the claims", () => {
    validatePersonTypeInClaim(testClaims as AuthorizationClaims);
    expect(getPersonTypeFromClaims).toHaveBeenCalledExactlyOnceWith(testClaims);
  });
});
