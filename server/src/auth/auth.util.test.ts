import { beforeEach, describe, it, expect, vi } from "vitest";
import { prisma } from "../prismaClient.js";
import {
  verifyRole,
  extractExternalUserIdFromIdentities,
  createHeaderGetter,
  buildContextFromClaims,
} from "./auth.util";
import { GraphQLError } from "graphql";

vi.mock("../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("auth.util", () => {
  const mockPrismaClient = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    person: {
      create: vi.fn(),
    },
    systemRoleAssignment: {
      findMany: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  describe("verifyRole", () => {
    it("should accept valid person types", () => {
      expect(() => verifyRole("demos-admin")).not.toThrow();
    });

    it("should throw for invalid person types", () => {
      expect(() => verifyRole("not a real thing")).toThrow("Invalid user role: 'not a real thing'");
    });
  });

  describe("buildContextFromClaims", () => {
    it("includes the user's permissions in the returned context", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce({
        id: "user-123",
        personTypeId: "demos-admin",
      });
      mockPrismaClient.systemRoleAssignment.findMany.mockResolvedValueOnce([
        { roleId: "system-role-1" },
        { roleId: "system-role-2" },
      ]);
      mockPrismaClient.rolePermission.findMany.mockResolvedValueOnce([
        { permissionId: "View All Demonstrations" },
        { permissionId: "View All Amendments" },
      ]);

      const context = await buildContextFromClaims({
        sub: "cognito-sub-123",
        role: "demos-admin",
        email: "user@example.com",
        givenName: "Test",
        familyName: "User",
      });

      expect(context).toEqual({
        user: {
          id: "user-123",
          sub: "cognito-sub-123",
          role: "demos-admin",
          permissions: ["View All Demonstrations", "View All Amendments"],
        },
      });
      expect(mockPrismaClient.systemRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith({
        where: { personId: "user-123" },
      });
      expect(mockPrismaClient.rolePermission.findMany).toHaveBeenCalledExactlyOnceWith({
        where: { roleId: { in: ["system-role-1", "system-role-2"] } },
      });
    });
  });

  describe("extractExternalUserIdFromIdentities", () => {
    it("should return userId when identities is a JSON string of a single object", () => {
      const identities = JSON.stringify({ userId: " external-123 " });
      const result = extractExternalUserIdFromIdentities(identities);
      expect(result).toBe("external-123");
    });

    it("should return the first non-empty userId when identities is a JSON string array", () => {
      const identities = JSON.stringify([
        { userId: "" },
        { userId: "   " },
        { userId: " user-abc " },
        { userId: "ignored" },
      ]);

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("user-abc");
    });

    it("should return userId when identities is an object", () => {
      const identities = { userId: " direct-456 " };

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("direct-456");
    });

    it("should return first non-empty userId when identities is an array of objects", () => {
      const identities = [
        { someOtherField: "x" },
        { userId: "" },
        { userId: "   " },
        { userId: " final-id " },
      ];

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("final-id");
    });

    it("should fall back to rawAll['cognito:username'] when no userId is found", () => {
      const identities = [{ someField: "no userId here" }, { userId: "" }, { userId: "   " }];
      const rawAll = { "cognito:username": "  cognito-user-789  " };

      const result = extractExternalUserIdFromIdentities(identities, rawAll);

      expect(result).toBe("cognito-user-789");
    });

    it("should return undefined when neither userId nor cognito:username is available", () => {
      const identities = [{ foo: "bar" }];
      const rawAll = { "cognito:username": 1234 }; // not a string

      const result = extractExternalUserIdFromIdentities(identities, rawAll);

      expect(result).toBeUndefined();
    });
  });

  describe("createHeaderGetter", () => {
    it("should return a function", () => {
      const getter = createHeaderGetter({});
      expect(typeof getter).toBe("function");
    });

    it("should get the existing header in a case-insensitive way", () => {
      const getter = createHeaderGetter({
        "Content-Type": "application/json",
        "X-Custom-Header": "foobar",
      });

      expect(getter("Content-Type")).toBe("application/json");
      expect(getter("content-type")).toBe("application/json");
      expect(getter("CONTENT-TYPE")).toBe("application/json");

      expect(getter("X-Custom-Header")).toBe("foobar");
      expect(getter("x-custom-header")).toBe("foobar");
    });

    it("should return undefined for a missing header", () => {
      const getter = createHeaderGetter({
        "Content-Type": "application/json",
      });

      expect(getter("Authorization")).toBeUndefined();
    });

    it("should handle an undefined input object", () => {
      const getter = createHeaderGetter(undefined);

      expect(getter("anything")).toBeUndefined();
    });

    it("should handle a null input object", () => {
      const getter = createHeaderGetter(null);

      expect(getter("anything")).toBeUndefined();
    });

    it("should work when some values are explicitly undefined", () => {
      const getter = createHeaderGetter({
        "X-Has-No-Value": undefined,
        "X-Other": "value",
      });

      expect(getter("X-Has-No-Value")).toBeUndefined();
      expect(getter("x-has-no-value")).toBeUndefined();
      expect(getter("X-Other")).toBe("value");
    });
  });
});
