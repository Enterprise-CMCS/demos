// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { User as PrismaUser } from "@prisma/client";

// Functions under test
import { findNewlyMigratedUserByEmail } from "./findNewlyMigratedUserByEmail";

// Mock imports
vi.mock("../../model/user/queries", () => ({
  selectManyUsers: vi.fn(),
}));

import { selectManyUsers } from "../../model/user/queries";

describe("findNewlyMigratedUserByEmail", () => {
  // Test inputs
  const testTransaction = "test-transaction" as any;
  const testEmail = "ada.lovelace@example.com";

  // Mock return values
  const mockUser: Partial<PrismaUser> = { id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89" };
  const mockOtherUser: Partial<PrismaUser> = { id: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should query for newly migrated, never-logged-in users by email", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([mockUser as PrismaUser]);

    await findNewlyMigratedUserByEmail(testEmail, testTransaction);

    expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith(
      { person: { email: testEmail }, isMigratedFromPmda: true, hasLoggedIn: false },
      testTransaction
    );
  });

  it("should report No Match when no users are found", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([]);

    const result = await findNewlyMigratedUserByEmail(testEmail, testTransaction);

    expect(result).toEqual({ users: [], resultType: "No Match" });
  });

  it("should report Exactly One Match when a single user is found", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([mockUser as PrismaUser]);

    const result = await findNewlyMigratedUserByEmail(testEmail, testTransaction);

    expect(result).toEqual({ users: [mockUser], resultType: "Exactly One Match" });
  });

  it("should report More Than One Match when multiple users are found", async () => {
    vi.mocked(selectManyUsers).mockResolvedValue([
      mockUser as PrismaUser,
      mockOtherUser as PrismaUser,
    ]);

    const result = await findNewlyMigratedUserByEmail(testEmail, testTransaction);

    expect(result).toEqual({
      users: [mockUser, mockOtherUser],
      resultType: "More Than One Match",
    });
  });
});
