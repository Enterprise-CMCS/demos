// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { User as PrismaUser } from "@prisma/client";
import type { AuthorizationClaims } from "..";
import type { UserType } from "../../types";

// Functions under test
import { linkNewlyMigratedUserFromClaims } from "./linkNewlyMigratedUserFromClaims";

// Mock imports
vi.mock(".", () => ({
  findNewlyMigratedUserByEmail: vi.fn(),
  findUserByClaims: vi.fn(),
  getPersonTypeFromClaims: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    error: vi.fn(),
  },
}));

// Thrown by the mocked throwCustomGQLError
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

vi.mock("../../model/user/queries", () => ({
  updateUser: vi.fn(),
}));

vi.mock("../../model/person/queries", () => ({
  updatePerson: vi.fn(),
}));

import { findNewlyMigratedUserByEmail, findUserByClaims, getPersonTypeFromClaims } from ".";
import { log } from "../../log";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { updateUser } from "../../model/user/queries";
import { updatePerson } from "../../model/person/queries";

describe("linkNewlyMigratedUserFromClaims", () => {
  // Test inputs
  const testTransaction = "test-transaction" as any;
  const testPersonTypeId = "demos-admin" satisfies UserType;
  const testClaims: Partial<AuthorizationClaims> = {
    sub: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    email: "ada.lovelace@example.com",
    givenName: "Ada",
    familyName: "Lovelace",
    externalUserId: "ada.lovelace",
  };

  // Mock return values
  const mockMigratedUser: Partial<PrismaUser> = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
    personTypeId: testPersonTypeId,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getPersonTypeFromClaims).mockReturnValue(testPersonTypeId);
  });

  it("should look up newly migrated users by the claim email", async () => {
    vi.mocked(findNewlyMigratedUserByEmail).mockResolvedValue({
      users: [mockMigratedUser as PrismaUser],
      resultType: "Exactly One Match",
    });

    await linkNewlyMigratedUserFromClaims(testClaims as AuthorizationClaims, testTransaction);

    expect(findNewlyMigratedUserByEmail).toHaveBeenCalledExactlyOnceWith(
      testClaims.email,
      testTransaction
    );
  });

  it("should return null and not link when no migrated user matches", async () => {
    vi.mocked(findNewlyMigratedUserByEmail).mockResolvedValue({
      users: [],
      resultType: "No Match",
    });

    const result = await linkNewlyMigratedUserFromClaims(
      testClaims as AuthorizationClaims,
      testTransaction
    );

    expect(result).toBeNull();
    expect(updatePerson).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
    expect(findUserByClaims).not.toHaveBeenCalled();
  });

  it("should log and throw when more than one migrated user matches", async () => {
    vi.mocked(findNewlyMigratedUserByEmail).mockResolvedValue({
      users: [mockMigratedUser as PrismaUser, mockMigratedUser as PrismaUser],
      resultType: "More Than One Match",
    });

    await expect(
      linkNewlyMigratedUserFromClaims(testClaims as AuthorizationClaims, testTransaction)
    ).rejects.toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Attempted to link Cognito subject ${testClaims.sub} to migrated users via email; ` +
        "more than one match was found.",
      "USER_MIGRATION_MULTIPLE_RECORD_ERROR"
    );
    expect(updatePerson).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("should log and throw when the migrated user's person type does not match the claim", async () => {
    vi.mocked(findNewlyMigratedUserByEmail).mockResolvedValue({
      users: [{ ...mockMigratedUser, personTypeId: "demos-state-user" } as PrismaUser],
      resultType: "Exactly One Match",
    });
    vi.mocked(getPersonTypeFromClaims).mockReturnValue("demos-admin");

    await expect(
      linkNewlyMigratedUserFromClaims(testClaims as AuthorizationClaims, testTransaction)
    ).rejects.toThrow(testCustomGQLError);

    expect(log.error).toHaveBeenCalledOnce();
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      `Migrated user with Cognito subject ${testClaims.sub} has personTypeId of ` +
        `demos-state-user in DEMOS, but demos-admin in Cognito.`,
      "USER_MIGRATION_PERSON_TYPE_MISMATCH_ERROR"
    );
    expect(updatePerson).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("should overwrite the claim fields and link the migrated user when exactly one matches", async () => {
    vi.mocked(findNewlyMigratedUserByEmail).mockResolvedValue({
      users: [mockMigratedUser as PrismaUser],
      resultType: "Exactly One Match",
    });

    await linkNewlyMigratedUserFromClaims(testClaims as AuthorizationClaims, testTransaction);

    expect(updatePerson).toHaveBeenCalledExactlyOnceWith(
      { id: mockMigratedUser.id },
      { firstName: testClaims.givenName, lastName: testClaims.familyName },
      testTransaction
    );
    expect(updateUser).toHaveBeenCalledExactlyOnceWith(
      { id: mockMigratedUser.id },
      { cognitoSubject: testClaims.sub, username: testClaims.externalUserId, hasLoggedIn: true },
      testTransaction
    );
    expect(findUserByClaims).toHaveBeenCalledExactlyOnceWith(testClaims, testTransaction);
  });
});
