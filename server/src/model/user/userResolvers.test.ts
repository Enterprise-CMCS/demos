import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock imports
import { DeepPartial } from "../../testUtilities";

import { Person as PrismaPerson, User as PrismaUser } from "@prisma/client";
import type { SystemRoleAssignmentQueryResult } from "../systemRoleAssignment";
import type { GraphQLContext } from "../../auth";
import type { Loaders } from "../../loaders";

import { userResolvers } from "./userResolvers";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../systemRoleAssignment", () => ({
  selectManySystemRoleAssignments: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectUserOrThrow: vi.fn(),
  selectManyUsers: vi.fn(),
}));

vi.mock("../userSession/queries", () => ({
  selectLastLoginForUser: vi.fn(),
}));

import { selectManySystemRoleAssignments } from "../systemRoleAssignment";
import { getManyDocuments } from "../document";
import { selectUserOrThrow, selectManyUsers } from "./queries";
import { selectLastLoginForUser } from "../userSession/queries";

describe("userResolvers", () => {
  const testUserId = "abc123";
  const mockLoaders = {
    personById: { load: vi.fn() },
  } as unknown as Loaders;
  const mockContext = {
    user: {
      id: testUserId,
    },
    loaders: mockLoaders,
  } as unknown as GraphQLContext;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Query.currentUser", () => {
    it("delegates to `userData/queries.selectUser`", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      await userResolvers.Query.currentUser(mockUser, undefined, mockContext);
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith({ id: "abc123" });
    });
  });

  describe("Query.users", () => {
    it("delegates to `userData/queries.selectManyUsers`", async () => {
      await userResolvers.Query.users();
      expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith({});
    });
  });

  describe("User.ownedDocuments", () => {
    it("delegates to `documentData.getManyDocuments`", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      await userResolvers.User.ownedDocuments(mockUser, undefined, mockContext);
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        { ownerUserId: "abc123" },
        mockContext.user
      );
    });
  });

  describe("User.person", () => {
    it("delegates to the personById loader", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      const person = { id: "abc123" } as PrismaPerson;
      vi.mocked(mockLoaders.personById.load).mockResolvedValue(person);
      const result = await userResolvers.User.person(mockUser, undefined, mockContext);
      expect(mockLoaders.personById.load).toHaveBeenCalledExactlyOnceWith("abc123");
      expect(result).toBe(person);
    });
  });

  describe("User.systemRoles", () => {
    const testSystemRoleAssignments: DeepPartial<SystemRoleAssignmentQueryResult>[] = [
      {
        personId: "person-1",
        roleId: "role-1",
      },
      {
        personId: "person-1",
        roleId: "role-2",
      },
    ];

    it("delegates to `systemRoleAssignment.queries.selectManySystemRoleAssignments` and maps result", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      vi.mocked(selectManySystemRoleAssignments).mockResolvedValueOnce(
        testSystemRoleAssignments as SystemRoleAssignmentQueryResult[]
      );
      const result = await userResolvers.User.systemRoles(mockUser);
      expect(selectManySystemRoleAssignments).toHaveBeenCalledExactlyOnceWith({
        personId: "abc123",
      });
      expect(result).toStrictEqual(["role-1", "role-2"]);
    });
  });

  describe("User.permissions", () => {
    const testSystemRoleAssignments: DeepPartial<SystemRoleAssignmentQueryResult>[] = [
      {
        personId: "person-1",
        role: {
          rolePermissions: [
            {
              permissionId: "permission-1",
            },
            {
              permissionId: "permission-2",
            },
          ],
        },
      },
      {
        personId: "person-1",
        role: {
          rolePermissions: [
            {
              permissionId: "permission-2",
            },
            {
              permissionId: "permission-3",
            },
          ],
        },
      },
    ];

    it("delegates to `systemRoleAssignment.queries.selectManySystemRoleAssignments` and maps result", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      vi.mocked(selectManySystemRoleAssignments).mockResolvedValueOnce(
        testSystemRoleAssignments as SystemRoleAssignmentQueryResult[]
      );
      const result = await userResolvers.User.permissions(mockUser);
      expect(selectManySystemRoleAssignments).toHaveBeenCalledExactlyOnceWith({
        personId: "abc123",
      });
      expect(result).toStrictEqual(["permission-1", "permission-2", "permission-3"]);
    });
  });

  describe("User.lastLogin", () => {
    it("delegates to selectLastLoginForUser", async () => {
      const testUser = {
        id: "abc123",
      } as PrismaUser;
      await userResolvers.User.lastLogin(testUser);
      expect(selectLastLoginForUser).toHaveBeenCalledExactlyOnceWith(testUser.id);
    });
  });
});
