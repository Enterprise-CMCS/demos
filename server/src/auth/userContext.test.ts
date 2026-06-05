import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthorizationClaims } from "./auth.util";
import { findOrCreateContextUserFromClaims, getPersonTypeFromClaims } from "./userContext";

vi.mock("../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../model/userSession/queries", () => ({
  upsertUserSession: vi.fn(),
}));

import { prisma } from "../prismaClient";
import { upsertUserSession } from "../model/userSession/queries";

describe("findOrCreateContextUserFromClaims", () => {
  const mockTransaction = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    person: {
      create: vi.fn(),
    },
    systemRoleAssignment: {
      create: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const claims: AuthorizationClaims = {
    sub: "sub-123",
    email: "user@example.com",
    role: "unrelated-role1,demos-admin,unrelated-role2",
    givenName: "Test",
    familyName: "User",
    externalUserId: "external-123",
    authTime: new Date(1779211277000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("returns the existing user when one matches the cognito subject", async () => {
    mockTransaction.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      person: {
        systemRoleAssignments: [
          {
            roleId: "Role 1",
          },
          {
            roleId: "Role 2",
          },
        ],
      },
    });
    mockTransaction.rolePermission.findMany.mockResolvedValueOnce([
      {
        permissionId: "permission-1",
      },
      {
        permissionId: "permission-2",
      },
    ]);

    const result = await findOrCreateContextUserFromClaims(claims);

    expect(prisma).toHaveBeenCalledOnce();
    expect(mockTransaction.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: true,
          },
        },
      },
    });
    expect(mockTransaction.rolePermission.findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        roleId: {
          in: ["Role 1", "Role 2"],
        },
      },
    });
    expect(upsertUserSession).toHaveBeenCalledExactlyOnceWith(
      "user-1",
      claims.authTime,
      mockTransaction
    );
    expect(mockTransaction.person.create).not.toHaveBeenCalled();
    expect(mockTransaction.user.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: "user-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      permissions: ["permission-1", "permission-2"],
    });
  });

  it("creates a new person and user when no existing user matches the cognito subject", async () => {
    mockTransaction.user.findUnique.mockResolvedValueOnce(null);
    mockTransaction.person.create.mockResolvedValueOnce({
      id: "person-1",
      personTypeId: "demos-admin",
    });
    mockTransaction.user.create.mockResolvedValueOnce({
      id: "person-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
    });
    mockTransaction.systemRoleAssignment.create.mockResolvedValueOnce({
      role: {
        rolePermissions: [{ permissionId: "permission-1" }, { permissionId: "permission-2" }],
      },
    });

    const result = await findOrCreateContextUserFromClaims(claims);

    expect(vi.mocked(prisma).mock.calls.length).toBe(2);
    expect(mockTransaction.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: true,
          },
        },
      },
    });
    expect(mockTransaction.person.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        personTypeId: "demos-admin",
        email: claims.email,
        firstName: claims.givenName,
        lastName: claims.familyName,
      },
    });
    expect(mockTransaction.user.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        id: "person-1",
        personTypeId: "demos-admin",
        cognitoSubject: claims.sub,
        username: claims.externalUserId,
      },
    });
    expect(mockTransaction.systemRoleAssignment.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        personId: "person-1",
        grantLevelId: "System",
        personTypeId: "demos-admin",
        roleId: "Admin User",
      },
      include: {
        role: {
          include: {
            rolePermissions: true,
          },
        },
      },
    });
    expect(upsertUserSession).toHaveBeenCalledExactlyOnceWith(
      "person-1",
      claims.authTime,
      mockTransaction
    );
    expect(result).toEqual({
      id: "person-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      permissions: ["permission-1", "permission-2"],
    });
  });

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
});
