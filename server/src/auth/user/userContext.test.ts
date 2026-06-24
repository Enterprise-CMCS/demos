// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { AuthorizationClaims } from "..";
import type { ContextUser } from ".";

// Functions under test
import { findOrCreateContextUserFromClaims } from "./userContext";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  findUserByCognitoSubject: vi.fn(),
  createNewUserFromClaims: vi.fn(),
}));

vi.mock("../../model/userSession/queries", () => ({
  upsertUserSession: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { findUserByCognitoSubject, createNewUserFromClaims } from ".";
import { upsertUserSession } from "../../model/userSession/queries";

describe("findOrCreateContextUserFromClaims", () => {
  // Test inputs
  const testTransaction = "test-transaction" as any;
  const testClaims: Partial<AuthorizationClaims> = {
    sub: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    authTime: new Date("2026-01-01T00:00:00.000Z"),
  };

  // Mock return values
  const mockExistingUser: ContextUser = {
    id: "existing-user-id",
    cognitoSubject: testClaims.sub!,
    personTypeId: "demos-admin",
    permissions: ["View All Demonstrations"],
  };
  const mockNewUser: ContextUser = {
    id: "new-user-id",
    cognitoSubject: testClaims.sub!,
    personTypeId: "demos-admin",
    permissions: ["View All Demonstrations"],
  };

  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(testTransaction));
  });

  it("should return the existing user and skip creation when one matches the Cognito subject", async () => {
    vi.mocked(findUserByCognitoSubject).mockResolvedValue(mockExistingUser);

    const result = await findOrCreateContextUserFromClaims(testClaims as AuthorizationClaims);

    expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
    expect(findUserByCognitoSubject).toHaveBeenCalledExactlyOnceWith(
      testClaims.sub,
      testTransaction
    );
    expect(createNewUserFromClaims).not.toHaveBeenCalled();
    expect(upsertUserSession).toHaveBeenCalledExactlyOnceWith(
      mockExistingUser.id,
      testClaims.authTime,
      testTransaction
    );
    expect(result).toBe(mockExistingUser);
  });

  it("should create a new user when none matches the Cognito subject", async () => {
    vi.mocked(findUserByCognitoSubject).mockResolvedValue(null);
    vi.mocked(createNewUserFromClaims).mockResolvedValue(mockNewUser);

    const result = await findOrCreateContextUserFromClaims(testClaims as AuthorizationClaims);

    expect(findUserByCognitoSubject).toHaveBeenCalledExactlyOnceWith(
      testClaims.sub,
      testTransaction
    );
    expect(createNewUserFromClaims).toHaveBeenCalledExactlyOnceWith(testClaims, testTransaction);
    expect(upsertUserSession).toHaveBeenCalledExactlyOnceWith(
      mockNewUser.id,
      testClaims.authTime,
      testTransaction
    );
    expect(result).toBe(mockNewUser);
  });
});
