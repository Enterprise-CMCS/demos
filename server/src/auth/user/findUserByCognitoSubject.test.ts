// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { User as PrismaUser, RolePermission as PrismaRolePermission } from "@prisma/client";
import type { SystemRoleAssignmentQueryResult } from "../../model/systemRoleAssignment";
import type { UserType, SystemRole } from "../../types";

// Functions under test
import { findUserByCognitoSubject } from "./findUserByCognitoSubject";

// Mock imports
vi.mock("../../model/user/queries", () => ({
  selectUser: vi.fn(),
}));

vi.mock("../../model/systemRoleAssignment", () => ({
  selectManySystemRoleAssignments: vi.fn(),
}));

vi.mock("../../model/rolePermission/queries", () => ({
  selectManyRolePermissions: vi.fn(),
}));

import { selectUser } from "../../model/user/queries";
import { selectManySystemRoleAssignments } from "../../model/systemRoleAssignment";
import { selectManyRolePermissions } from "../../model/rolePermission/queries";

describe("findUserByCognitoSubject", () => {
  // Test inputs
  const testTransaction = "test-transaction" as any;
  const testCognitoSubject = "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7";

  // Mock returns
  const mockUser: Partial<PrismaUser> = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
    personTypeId: "demos-admin" satisfies UserType,
  };
  const mockSystemRoles: Partial<SystemRoleAssignmentQueryResult>[] = [
    { roleId: "Admin User" satisfies SystemRole },
  ];
  const mockRolePermissions: Partial<PrismaRolePermission>[] = [
    { permissionId: "view-demonstration" },
    { permissionId: "see-records-for-state-users" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(selectUser).mockResolvedValue(mockUser as PrismaUser);
    vi.mocked(selectManySystemRoleAssignments).mockResolvedValue(
      mockSystemRoles as SystemRoleAssignmentQueryResult[]
    );
    vi.mocked(selectManyRolePermissions).mockResolvedValue(
      mockRolePermissions as PrismaRolePermission[]
    );
  });

  it("should look up the user by Cognito subject", async () => {
    await findUserByCognitoSubject(testCognitoSubject, testTransaction);

    expect(selectUser).toHaveBeenCalledExactlyOnceWith(
      { cognitoSubject: testCognitoSubject },
      testTransaction
    );
  });

  it("should return null and not look up roles when no user matches", async () => {
    vi.mocked(selectUser).mockResolvedValue(null);

    const result = await findUserByCognitoSubject(testCognitoSubject, testTransaction);

    expect(result).toBeNull();
    expect(selectManySystemRoleAssignments).not.toHaveBeenCalled();
    expect(selectManyRolePermissions).not.toHaveBeenCalled();
  });

  it("should look up the system role assignments for the user", async () => {
    await findUserByCognitoSubject(testCognitoSubject, testTransaction);

    expect(selectManySystemRoleAssignments).toHaveBeenCalledExactlyOnceWith(
      { personId: mockUser.id },
      testTransaction
    );
  });

  it("should look up the permissions for the assigned roles", async () => {
    await findUserByCognitoSubject(testCognitoSubject, testTransaction);

    expect(selectManyRolePermissions).toHaveBeenCalledExactlyOnceWith(
      { roleId: { in: mockSystemRoles.map((sr) => sr.roleId) } },
      testTransaction
    );
  });

  it("should return the context user", async () => {
    const result = await findUserByCognitoSubject(testCognitoSubject, testTransaction);

    expect(result).toEqual({
      id: mockUser.id,
      cognitoSubject: testCognitoSubject,
      personTypeId: mockUser.personTypeId,
      permissions: mockRolePermissions.map((rp) => rp.permissionId),
    });
  });
});
