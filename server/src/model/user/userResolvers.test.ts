import { describe, it, expect, vi, beforeEach } from "vitest";
import { User, Person } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    person: {
      create: vi.fn(),
      update: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    systemRoleAssignment: {
      findMany: vi.fn(),
    },
  })),
}));

import { prisma } from "../../prismaClient.js";
import {
  findUniqueUser,
  findManyUsers,
  userResolvers,
} from "./userResolvers";
import { GraphQLContext } from "../../auth/auth.util.js";

describe("userResolvers", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    person: {
      create: vi.fn(),
      update: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    systemRoleAssignment: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
    // Clear console.error mock
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("findUniqueUser", () => {
    it("should return user with person data when user exists", async () => {
      const mockUserWithPerson = {
        id: "user-1",
        username: "testuser",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
        person: {
          id: "user-1",
          fullName: "Test User",
          displayName: "Test",
          email: "test@example.com",
          personTypeId: "demos-admin",
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPerson);

      const result = await findUniqueUser("user-1");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        include: { person: true },
      });

    
    });

    it("should return null when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await findUniqueUser("non-existent");

      expect(result).toBeNull();
    });

    
  });

  describe("findManyUsers", () => {
    it("should return all users when no where clause provided", async () => {
      const mockUsers = [
        {
          id: "user-1",
          username: "user1",
          cognitoSubject: "cognito-1",
          personTypeId: "demos-admin",
          person: {
            id: "user-1",
            fullName: "User One",
            displayName: "User1",
            email: "user1@example.com",
            personTypeId: "demos-admin",
          },
        },
        {
          id: "user-2",
          username: "user2",
          cognitoSubject: "cognito-2",
          personTypeId: "demos-cms-user",
          person: {
            id: "user-2",
            fullName: "User Two",
            displayName: "User2",
            email: "user2@example.com",
            personTypeId: "demos-cms-user",
          },
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await findManyUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { person: true },
      });

      expect(result).toHaveLength(2);      
    });

    it("should filter users when where clause provided", async () => {
      const mockUsers = [
        {
          id: "user-1",
          username: "admin",
          cognitoSubject: "cognito-1",
          personTypeId: "demos-admin",
          person: {
            id: "user-1",
            fullName: "Admin User",
            displayName: "Admin",
            email: "admin@example.com",
            personTypeId: "demos-admin",
          },
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await findManyUsers({ personTypeId: "demos-admin" });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { personTypeId: "demos-admin" },
        include: { person: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].personTypeId).toBe("demos-admin");
    });

    it("should filter out users without person data", async () => {
      const mockUsers = [
        {
          id: "user-1",
          username: "user1",
          cognitoSubject: "cognito-1",
          personTypeId: "demos-admin",
          person: {
            id: "user-1",
            fullName: "User One",
            displayName: "User1",
            email: "user1@example.com",
            personTypeId: "demos-admin",
          },
        },
        {
          id: "user-2",
          username: "user2",
          cognitoSubject: "cognito-2",
          personTypeId: "demos-cms-user",
          person: null,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await findManyUsers();

      expect(result).toHaveLength(2);      
    });

    it("should return empty array when no users found", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await findManyUsers();

      expect(result).toEqual([]);
    });
  });

  describe("Query resolvers", () => {
    describe("user", () => {
      it("should return user by id", async () => {
        const mockUser = {
          id: "user-1",
          username: "testuser",
          fullName: "Test User",
        };

        const mockUserWithPerson = {
          id: "user-1",
          username: "testuser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-admin",
          person: {
            id: "user-1",
            fullName: "Test User",
            displayName: "Test",
            email: "test@example.com",
            personTypeId: "demos-admin",
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPerson);

        const result = await userResolvers.Query.user(undefined, { id: "user-1" });

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-1");
      });

      it("should return null when user not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await userResolvers.Query.user(undefined, { id: "non-existent" });

        expect(result).toBeNull();
      });
    });

    describe("users", () => {
      it("should return all users", async () => {
        const mockUsers = [
          {
            id: "user-1",
            username: "user1",
            cognitoSubject: "cognito-1",
            personTypeId: "demos-admin",
            person: {
              id: "user-1",
              fullName: "User One",
              displayName: "User1",
              email: "user1@example.com",
              personTypeId: "demos-admin",
            },
          },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const result = await userResolvers.Query.users();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("user-1");
      });
    });

    describe("currentUser", () => {
      it("should return current user when context has user", async () => {
        const mockContext: GraphQLContext = {
          user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
        };

        const mockUserWithPerson = {
          id: "user-1",
          username: "currentuser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-admin",
          person: {
            id: "user-1",
            fullName: "Current User",
            displayName: "Current",
            email: "current@example.com",
            personTypeId: "demos-admin",
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPerson);

        const result = await userResolvers.Query.currentUser(undefined, {}, mockContext);

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-1");
        expect(result?.fullName).toBe("Current User");
      });

      it("should return null when context has no user", async () => {
        const mockContext: GraphQLContext = { user: null };

        const result = await userResolvers.Query.currentUser(undefined, {}, mockContext);

        expect(result).toBeNull();
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should throw error and log when database query fails", async () => {
        const mockContext: GraphQLContext = {
          user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
        };

        const dbError = new Error("Database connection failed");
        mockPrisma.user.findUnique.mockRejectedValue(dbError);

        await expect(
          userResolvers.Query.currentUser(undefined, {}, mockContext)
        ).rejects.toThrow("Database connection failed");

        expect(console.error).toHaveBeenCalledWith("[currentUser] resolver error:", dbError);
      });
    });
  });

  describe("Mutation resolvers", () => {
    describe("createUser", () => {
      const mockInput = {
        email: "new@example.com",
        username: "newuser",
        cognitoSubject: "cognito-new",
        personTypeId: "demos-admin",
        fullName: "New User",
        displayName: "New",
      };

      it("should create user with person data", async () => {
        const mockPerson = {
          id: "person-1",
          displayName: "New",
          fullName: "New User",
          email: "new@example.com",
          personTypeId: "demos-admin",
        };

        const mockUser = {
          id: "person-1",
          username: "newuser",
          cognitoSubject: "cognito-new",
          personTypeId: "demos-admin",
        };

        mockPrisma.person.create.mockResolvedValue(mockPerson);
        mockPrisma.user.create.mockResolvedValue(mockUser);

        const result = await userResolvers.Mutation.createUser(undefined, { input: mockInput });

        expect(mockPrisma.person.create).toHaveBeenCalledWith({
          data: {
            displayName: "New",
            fullName: "New User",
            email: "new@example.com",
            personTypeId: "demos-admin",
          },
        });

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            username: "newuser",
            cognitoSubject: "cognito-new",
            id: "person-1",
            personTypeId: "demos-admin",
          },
        });

        expect(result).toEqual({
          id: "person-1",
          username: "newuser",
          cognitoSubject: "cognito-new",
          personTypeId: "demos-admin",
          displayName: "New",
          fullName: "New User",
          email: "new@example.com",
        });
      });

      it("should handle person creation error", async () => {
        const personError = new Error("Person creation failed");
        mockPrisma.person.create.mockRejectedValue(personError);

        await expect(
          userResolvers.Mutation.createUser(undefined, { input: mockInput })
        ).rejects.toThrow("Person creation failed");

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      });

      it("should handle user creation error after person created", async () => {
        const mockPerson = {
          id: "person-1",
          displayName: "New",
          fullName: "New User",
          email: "new@example.com",
          personTypeId: "demos-admin",
        };

        const userError = new Error("User creation failed");
        mockPrisma.person.create.mockResolvedValue(mockPerson);
        mockPrisma.user.create.mockRejectedValue(userError);

        await expect(
          userResolvers.Mutation.createUser(undefined, { input: mockInput })
        ).rejects.toThrow("User creation failed");
      });
    });

    describe("updateUser", () => {
      const mockInput = {
        fullName: "Updated User",
        displayName: "Updated",
        email: "updated@example.com",
        username: "updateduser",
        personTypeId: "demos-cms-user",
      };

      it("should update user and person data", async () => {
        const mockUpdatedPerson = {
          id: "user-1",
          displayName: "Updated",
          fullName: "Updated User",
          email: "updated@example.com",
          personTypeId: "demos-cms-user",
        };

        const mockUpdatedUser = {
          id: "user-1",
          username: "updateduser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-cms-user",
        };

        mockPrisma.person.update.mockResolvedValue(mockUpdatedPerson);
        mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

        const result = await userResolvers.Mutation.updateUser(undefined, {
          id: "user-1",
          input: mockInput,
        });

        expect(mockPrisma.person.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: {
            displayName: "Updated",
            fullName: "Updated User",
            email: "updated@example.com",
            personTypeId: "demos-cms-user",
          },
        });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: {
            username: "updateduser",
          },
        });

        expect(result).toEqual({
          id: "user-1",
          username: "updateduser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-cms-user",
          displayName: "Updated",
          fullName: "Updated User",
          email: "updated@example.com",
        });
      });

      it("should handle partial updates", async () => {
        const partialInput = {
          displayName: "Partially Updated",
          username: "partialuser",
        };

        const mockUpdatedPerson = {
          id: "user-1",
          displayName: "Partially Updated",
          fullName: "Original Name",
          email: "original@example.com",
          personTypeId: "demos-admin",
        };

        const mockUpdatedUser = {
          id: "user-1",
          username: "partialuser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-admin",
        };

        mockPrisma.person.update.mockResolvedValue(mockUpdatedPerson);
        mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

        const result = await userResolvers.Mutation.updateUser(undefined, {
          id: "user-1",
          input: partialInput,
        });

        expect(mockPrisma.person.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: {
            displayName: "Partially Updated",
            fullName: undefined,
            email: undefined,
            personTypeId: undefined,
          },
        });

        expect(result.displayName).toBe("Partially Updated");
        expect(result.username).toBe("partialuser");
      });

      it("should handle person update error", async () => {
        const updateError = new Error("Person update failed");
        mockPrisma.person.update.mockRejectedValue(updateError);

        await expect(
          userResolvers.Mutation.updateUser(undefined, {
            id: "user-1",
            input: mockInput,
          })
        ).rejects.toThrow("Person update failed");

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle user update error after person updated", async () => {
        const mockUpdatedPerson = {
          id: "user-1",
          displayName: "Updated",
          fullName: "Updated User",
          email: "updated@example.com",
          personTypeId: "demos-cms-user",
        };

        const userUpdateError = new Error("User update failed");
        mockPrisma.person.update.mockResolvedValue(mockUpdatedPerson);
        mockPrisma.user.update.mockRejectedValue(userUpdateError);

        await expect(
          userResolvers.Mutation.updateUser(undefined, {
            id: "user-1",
            input: mockInput,
          })
        ).rejects.toThrow("User update failed");
      });
    });

    describe("deleteUser", () => {
      it("should delete user", async () => {
        const mockDeletedUser = {
          id: "user-1",
          username: "deleteduser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-admin",
        };

        mockPrisma.user.delete.mockResolvedValue(mockDeletedUser);

        const result = await userResolvers.Mutation.deleteUser(undefined, { id: "user-1" });

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({
          where: { id: "user-1" },
        });

        expect(result).toEqual(mockDeletedUser);
      });

      it("should handle delete error", async () => {
        const deleteError = new Error("Delete failed");
        mockPrisma.user.delete.mockRejectedValue(deleteError);

        await expect(
          userResolvers.Mutation.deleteUser(undefined, { id: "user-1" })
        ).rejects.toThrow("Delete failed");
      });
    });
  });

  describe("User field resolvers", () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      cognitoSubject: "cognito-123",
      personTypeId: "demos-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe("events", () => {
      it("should return user events", async () => {
        const mockEvents = [
          { id: "event-1", userId: "user-1", type: "LOGIN" },
          { id: "event-2", userId: "user-1", type: "LOGOUT" },
        ];

        mockPrisma.event.findMany.mockResolvedValue(mockEvents);

        const result = await userResolvers.User.events(mockUser);

        expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
          where: { userId: "user-1" },
        });

        expect(result).toEqual(mockEvents);
      });

      it("should return empty array when no events found", async () => {
        mockPrisma.event.findMany.mockResolvedValue([]);

        const result = await userResolvers.User.events(mockUser);

        expect(result).toEqual([]);
      });
    });

    describe("ownedDocuments", () => {
      it("should return user owned documents", async () => {
        const mockDocuments = [
          { id: "doc-1", ownerUserId: "user-1", title: "Document 1" },
          { id: "doc-2", ownerUserId: "user-1", title: "Document 2" },
        ];

        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await userResolvers.User.ownedDocuments(mockUser);

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: { ownerUserId: "user-1" },
        });

        expect(result).toEqual(mockDocuments);
      });

      it("should return empty array when no documents found", async () => {
        mockPrisma.document.findMany.mockResolvedValue([]);

        const result = await userResolvers.User.ownedDocuments(mockUser);

        expect(result).toEqual([]);
      });
    });

    describe("roles", () => {
      it("should return user roles", async () => {
        const mockAssignments = [
          {
            id: "assignment-1",
            personId: "user-1",
            roleId: "role-1",
            role: { id: "role-1", name: "Admin" },
          },
          {
            id: "assignment-2",
            personId: "user-1",
            roleId: "role-2",
            role: { id: "role-2", name: "User" },
          },
        ];

        mockPrisma.systemRoleAssignment.findMany.mockResolvedValue(mockAssignments);

        const result = await userResolvers.User.roles(mockUser);

        expect(mockPrisma.systemRoleAssignment.findMany).toHaveBeenCalledWith({
          where: { personId: "user-1" },
          include: { role: true },
        });

        expect(result).toEqual([
          { id: "role-1", name: "Admin" },
          { id: "role-2", name: "User" },
        ]);
      });

      it("should return empty array when no roles found", async () => {
        mockPrisma.systemRoleAssignment.findMany.mockResolvedValue([]);

        const result = await userResolvers.User.roles(mockUser);

        expect(result).toEqual([]);
      });
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors in findUniqueUser", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      await expect(findUniqueUser("user-1")).rejects.toThrow("Database connection failed");
    });

    it("should handle database connection errors in findManyUsers", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.user.findMany.mockRejectedValue(dbError);

      await expect(findManyUsers()).rejects.toThrow("Database connection failed");
    });

    it("should handle field resolver errors", async () => {
      const mockUser: User = {
        id: "user-1",
        username: "testuser",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dbError = new Error("Database connection failed");
      mockPrisma.event.findMany.mockRejectedValue(dbError);

      await expect(userResolvers.User.events(mockUser)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined values in input fields", async () => {
      const inputWithUndefined = {
        email: "test@example.com",
        username: "testuser",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
        fullName: undefined,
        displayName: undefined,
      };

      const mockPerson = {
        id: "person-1",
        displayName: undefined,
        fullName: undefined,
        email: "test@example.com",
        personTypeId: "demos-admin",
      };

      const mockUser = {
        id: "person-1",
        username: "testuser",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
      };

      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userResolvers.Mutation.createUser(undefined, {
        input: inputWithUndefined,
      });

      expect(mockPrisma.person.create).toHaveBeenCalledWith({
        data: {
          displayName: undefined,
          fullName: undefined,
          email: "test@example.com",
          personTypeId: "demos-admin",
        },
      });

      expect(result).toBeDefined();
    });

    it("should handle empty string values", async () => {
      const inputWithEmptyStrings = {
        email: "",
        username: "",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
        fullName: "",
        displayName: "",
      };

      const mockPerson = {
        id: "person-1",
        displayName: "",
        fullName: "",
        email: "",
        personTypeId: "demos-admin",
      };

      const mockUser = {
        id: "person-1",
        username: "",
        cognitoSubject: "cognito-123",
        personTypeId: "demos-admin",
      };

      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userResolvers.Mutation.createUser(undefined, {
        input: inputWithEmptyStrings,
      });

      expect(result.email).toBe("");
      expect(result.username).toBe("");
    });

    it("should handle special characters in user data", async () => {
      const inputWithSpecialChars = {
        email: "test+special@example.com",
        username: "user-name_123",
        cognitoSubject: "cognito-abc-123",
        personTypeId: "demos-admin",
        fullName: "Test User (Special)",
        displayName: "Test & User",
      };

      const mockPerson = {
        id: "person-1",
        displayName: "Test & User",
        fullName: "Test User (Special)",
        email: "test+special@example.com",
        personTypeId: "demos-admin",
      };

      const mockUser = {
        id: "person-1",
        username: "user-name_123",
        cognitoSubject: "cognito-abc-123",
        personTypeId: "demos-admin",
      };

      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userResolvers.Mutation.createUser(undefined, {
        input: inputWithSpecialChars,
      });

      expect(result.email).toBe("test+special@example.com");
      expect(result.fullName).toBe("Test User (Special)");
      expect(result.displayName).toBe("Test & User");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete user lifecycle", async () => {
      const createInput = {
        email: "lifecycle@example.com",
        username: "lifecycleuser",
        cognitoSubject: "cognito-lifecycle",
        personTypeId: "demos-admin",
        fullName: "Lifecycle User",
        displayName: "Lifecycle",
      };

      const updateInput = {
        fullName: "Updated Lifecycle User",
        displayName: "Updated",
        email: "updated-lifecycle@example.com",
        username: "updatedlifecycle",
        personTypeId: "demos-cms-user",
      };

      // Create
      const mockPerson = {
        id: "lifecycle-1",
        displayName: "Lifecycle",
        fullName: "Lifecycle User",
        email: "lifecycle@example.com",
        personTypeId: "demos-admin",
      };

      const mockUser = {
        id: "lifecycle-1",
        username: "lifecycleuser",
        cognitoSubject: "cognito-lifecycle",
        personTypeId: "demos-admin",
      };

      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const createResult = await userResolvers.Mutation.createUser(undefined, {
        input: createInput,
      });

      expect(createResult.id).toBe("lifecycle-1");

      // Update
      const mockUpdatedPerson = {
        id: "lifecycle-1",
        displayName: "Updated",
        fullName: "Updated Lifecycle User",
        email: "updated-lifecycle@example.com",
        personTypeId: "demos-cms-user",
      };

      const mockUpdatedUser = {
        id: "lifecycle-1",
        username: "updatedlifecycle",
        cognitoSubject: "cognito-lifecycle",
        personTypeId: "demos-cms-user",
      };

      mockPrisma.person.update.mockResolvedValue(mockUpdatedPerson);
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const updateResult = await userResolvers.Mutation.updateUser(undefined, {
        id: "lifecycle-1",
        input: updateInput,
      });

      expect(updateResult.fullName).toBe("Updated Lifecycle User");

      // Delete
      const mockDeletedUser = {
        id: "lifecycle-1",
        username: "updatedlifecycle",
        cognitoSubject: "cognito-lifecycle",
        personTypeId: "demos-cms-user",
      };

      mockPrisma.user.delete.mockResolvedValue(mockDeletedUser);

      const deleteResult = await userResolvers.Mutation.deleteUser(undefined, {
        id: "lifecycle-1",
      });

      expect(deleteResult.id).toBe("lifecycle-1");
    });
  });
});