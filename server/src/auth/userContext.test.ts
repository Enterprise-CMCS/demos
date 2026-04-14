import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prismaClient";
import type { AuthorizationClaims } from "./auth.util";
import { findOrCreateContextUserFromClaims } from "./userContext";

vi.mock("../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("findOrCreateContextUserFromClaims", () => {
  const mockPrismaClient = {
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
  };

  const claims: AuthorizationClaims = {
    sub: "sub-123",
    email: "user@example.com",
    role: "demos-admin",
    givenName: "Test",
    familyName: "User",
    externalUserId: "external-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("returns the existing user when one matches the cognito subject", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      person: {
        systemRoleAssignments: [
          {
            role: {
              rolePermissions: [{ permissionId: "permission-1" }, { permissionId: "permission-2" }],
            },
          },
        ],
      },
    });

    const result = await findOrCreateContextUserFromClaims(claims);

    expect(mockPrismaClient.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: {
              include: {
                role: {
                  include: {
                    rolePermissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(mockPrismaClient.person.create).not.toHaveBeenCalled();
    expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: "user-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      permissions: ["permission-1", "permission-2"],
    });
  });

  it("creates a new person and user when no existing user matches the cognito subject", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
    mockPrismaClient.person.create.mockResolvedValueOnce({
      id: "person-1",
      personTypeId: "demos-admin",
    });
    mockPrismaClient.user.create.mockResolvedValueOnce({
      id: "person-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
    });
    mockPrismaClient.systemRoleAssignment.create.mockResolvedValueOnce({
      role: {
        rolePermissions: [{ permissionId: "permission-1" }, { permissionId: "permission-2" }],
      },
    });

    const result = await findOrCreateContextUserFromClaims(claims);

    expect(mockPrismaClient.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: {
              include: {
                role: {
                  include: {
                    rolePermissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(mockPrismaClient.person.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        personTypeId: claims.role,
        email: claims.email,
        firstName: claims.givenName,
        lastName: claims.familyName,
      },
    });
    expect(mockPrismaClient.user.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        id: "person-1",
        personTypeId: "demos-admin",
        cognitoSubject: claims.sub,
        username: claims.externalUserId,
      },
    });
    expect(result).toEqual({
      id: "person-1",
      cognitoSubject: claims.sub,
      personTypeId: "demos-admin",
      permissions: ["permission-1", "permission-2"],
    });
  });
});
