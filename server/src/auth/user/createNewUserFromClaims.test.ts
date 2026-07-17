// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { AuthorizationClaims } from "..";
import type {
  Person as PrismaPerson,
  SystemRoleAssignment as PrismaSystemRoleAssignment,
  RolePermission as PrismaRolePermission,
} from "@prisma/client";
import type { SystemRole, UserType } from "../../types";

// Functions under test
import { createNewUserFromClaims } from "./createNewUserFromClaims";

// Mock imports
vi.mock(".", () => ({
  getPersonTypeFromClaims: vi.fn(),
}));

vi.mock("../../model/person/queries", () => ({
  insertPerson: vi.fn(),
}));

vi.mock("../../model/user/queries", () => ({
  insertUser: vi.fn(),
}));

vi.mock("../../model/systemRoleAssignment/queries", () => ({
  insertSystemRoleAssignment: vi.fn(),
}));

vi.mock("../../model/rolePermission/queries", () => ({
  selectManyRolePermissions: vi.fn(),
}));

import { getPersonTypeFromClaims } from ".";
import { insertPerson } from "../../model/person/queries";
import { insertUser } from "../../model/user/queries";
import { insertSystemRoleAssignment } from "../../model/systemRoleAssignment/queries";
import { selectManyRolePermissions } from "../../model/rolePermission/queries";

describe("createNewUserFromClaims", () => {
  // Test inputs
  const testTransaction = "test-transaction" as any;
  const testClaims: AuthorizationClaims = {
    sub: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    email: "ada.lovelace@example.com",
    role: "demos-admin,some-other-role",
    givenName: "Ada",
    familyName: "Lovelace",
    externalUserId: "ada.lovelace",
    authTime: new Date("2026-01-01T00:00:00.000Z"),
  };

  // Mock returns
  const mockPersonTypeId: UserType = "demos-admin";
  const mockPerson: Partial<PrismaPerson> = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
  };
  const mockSystemRoleAssignment: Partial<PrismaSystemRoleAssignment> = {
    roleId: "Admin User" satisfies SystemRole,
  };
  const mockRolePermissions: Partial<PrismaRolePermission>[] = [
    {
      permissionId: "view-demonstration",
    },
    {
      permissionId: "see-records-for-state-users",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getPersonTypeFromClaims).mockReturnValue(mockPersonTypeId);
    vi.mocked(insertPerson).mockResolvedValue(mockPerson as PrismaPerson);
    vi.mocked(insertSystemRoleAssignment).mockResolvedValue(
      mockSystemRoleAssignment as PrismaSystemRoleAssignment
    );
    vi.mocked(selectManyRolePermissions).mockResolvedValue(
      mockRolePermissions as PrismaRolePermission[]
    );
  });

  it("should derive the person type from the claims", async () => {
    await createNewUserFromClaims(testClaims, testTransaction);
    expect(getPersonTypeFromClaims).toHaveBeenCalledExactlyOnceWith(testClaims);
  });

  it("should insert a person from the claim details", async () => {
    await createNewUserFromClaims(testClaims, testTransaction);
    expect(insertPerson).toHaveBeenCalledExactlyOnceWith(
      {
        personTypeId: mockPersonTypeId,
        email: testClaims.email,
        firstName: testClaims.givenName,
        lastName: testClaims.familyName,
      },
      testTransaction
    );
  });

  it("should insert a user from the derived person", async () => {
    await createNewUserFromClaims(testClaims, testTransaction);
    expect(insertUser).toHaveBeenCalledExactlyOnceWith(
      {
        id: mockPerson.id,
        personTypeId: mockPersonTypeId,
        cognitoSubject: testClaims.sub,
        username: testClaims.externalUserId,
        isMigratedFromPmda: false,
        hasLoggedIn: true,
      },
      testTransaction
    );
  });

  it("should assign the initial system role for the person type", async () => {
    await createNewUserFromClaims(testClaims, testTransaction);
    expect(insertSystemRoleAssignment).toHaveBeenCalledExactlyOnceWith(
      {
        personId: mockPerson.id,
        grantLevelId: "System",
        personTypeId: mockPersonTypeId,
        roleId: mockSystemRoleAssignment.roleId,
      },
      testTransaction
    );
  });

  it("should look up the permissions for the assigned role", async () => {
    await createNewUserFromClaims(testClaims, testTransaction);
    expect(selectManyRolePermissions).toHaveBeenCalledExactlyOnceWith(
      { roleId: mockSystemRoleAssignment.roleId },
      testTransaction
    );
  });

  it("should return the new context user", async () => {
    const result = await createNewUserFromClaims(testClaims, testTransaction);
    expect(result).toEqual({
      id: mockPerson.id,
      personTypeId: mockPersonTypeId,
      cognitoSubject: testClaims.sub,
      permissions: mockRolePermissions.map((p) => p.permissionId),
    });
  });
});
