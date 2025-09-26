import { describe, it, expect, vi, beforeEach } from "vitest";
import { Event } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    event: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  })),
}));

vi.mock("../../auth/auth.util.js", () => ({
  getCurrentUserId: vi.fn(),
  getCurrentUserRoleId: vi.fn(),
}));

import { prisma } from "../../prismaClient.js";
import { getCurrentUserId, getCurrentUserRoleId } from "../../auth/auth.util.js";
import { eventResolvers } from "./eventResolvers";
import { GraphQLContext } from "../../auth/auth.util.js";

describe("eventResolvers", () => {
  const mockPrisma = {
    event: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("Query resolvers", () => {
    describe("events", () => {
      it("should return all events ordered by createdAt desc", async () => {
        const mockEvents = [
          {
            id: "event-1",
            eventType: "LOGIN",
            logLevel: "INFO",
            userId: "user-1",
            createdAt: new Date("2024-01-02"),
          },
          {
            id: "event-2",
            eventType: "LOGOUT",
            logLevel: "INFO",
            userId: "user-1",
            createdAt: new Date("2024-01-01"),
          },
        ];

        mockPrisma.event.findMany.mockResolvedValue(mockEvents);

        const result = await eventResolvers.Query.events();

        expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
          orderBy: { createdAt: "desc" },
        });

        expect(result).toEqual(mockEvents);
      });

      it("should return empty array when no events exist", async () => {
        mockPrisma.event.findMany.mockResolvedValue([]);

        const result = await eventResolvers.Query.events();

        expect(result).toEqual([]);
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.event.findMany.mockRejectedValue(dbError);

        await expect(eventResolvers.Query.events()).rejects.toThrow(
          "Database connection failed"
        );
      });
    });
  });

  describe("Mutation resolvers", () => {
    describe("logEvent", () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      const mockInput = {
        eventType: "USER_ACTION",
        logLevel: "INFO",
        route: "/api/test",
        eventData: { action: "test", details: "test action" },
      };

      beforeEach(() => {
        (getCurrentUserId as any).mockResolvedValue("user-1");
        (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");
      });

      it("should successfully log event with user context", async () => {
        mockPrisma.event.create.mockResolvedValue({
          id: "event-1",
          userId: "user-1",
          eventType: "USER_ACTION",
          logLevel: "INFO",
          withRoleId: "demos-admin",
          route: "/api/test",
          eventData: {
            action: "test",
            details: "test action",
            userId: "user-1",
            roleId: "demos-admin",
          },
        });

        const result = await eventResolvers.Mutation.logEvent(
          undefined,
          { input: mockInput },
          mockContext
        );

        expect(getCurrentUserId).toHaveBeenCalledWith(mockContext);
        expect(getCurrentUserRoleId).toHaveBeenCalledWith(mockContext);

        expect(mockPrisma.event.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            eventType: "USER_ACTION",
            logLevel: "INFO",
            withRoleId: "demos-admin",
            route: "/api/test",
            eventData: {
              action: "test",
              details: "test action",
              userId: "user-1",
              roleId: "demos-admin",
            },
          },
        });

        expect(result).toEqual({ success: true });
      });

      it("should merge client event data with user context", async () => {
        const inputWithComplexData = {
          eventType: "COMPLEX_ACTION",
          logLevel: "DEBUG",
          route: "/api/complex",
          eventData: {
            nested: { value: "test" },
            array: [1, 2, 3],
            boolean: true,
            null: null,
          },
        };

        mockPrisma.event.create.mockResolvedValue({});

        await eventResolvers.Mutation.logEvent(
          undefined,
          { input: inputWithComplexData },
          mockContext
        );

        expect(mockPrisma.event.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            eventType: "COMPLEX_ACTION",
            logLevel: "DEBUG",
            withRoleId: "demos-admin",
            route: "/api/complex",
            eventData: {
              nested: { value: "test" },
              array: [1, 2, 3],
              boolean: true,
              null: null,
              userId: "user-1",
              roleId: "demos-admin",
            },
          },
        });
      });

      it("should handle null/undefined eventData", async () => {
        const inputWithNullData = {
          eventType: "NULL_DATA",
          logLevel: "WARN",
          route: "/api/null",
          eventData: null,
        };

        mockPrisma.event.create.mockResolvedValue({});

        await eventResolvers.Mutation.logEvent(
          undefined,
          { input: inputWithNullData },
          mockContext
        );

        expect(mockPrisma.event.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            eventType: "NULL_DATA",
            logLevel: "WARN",
            withRoleId: "demos-admin",
            route: "/api/null",
            eventData: {
              userId: "user-1",
              roleId: "demos-admin",
            },
          },
        });
      });

      it("should handle undefined eventData", async () => {
        const inputWithUndefinedData = {
          eventType: "UNDEFINED_DATA",
          logLevel: "ERROR",
          route: "/api/undefined",
          eventData: undefined,
        };

        mockPrisma.event.create.mockResolvedValue({});

        await eventResolvers.Mutation.logEvent(
          undefined,
          { input: inputWithUndefinedData },
          mockContext
        );

        expect(mockPrisma.event.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            eventType: "UNDEFINED_DATA",
            logLevel: "ERROR",
            withRoleId: "demos-admin",
            route: "/api/undefined",
            eventData: {
              userId: "user-1",
              roleId: "demos-admin",
            },
          },
        });
      });

      it("should return success false when database create fails", async () => {
        const dbError = new Error("Database constraint violation");
        mockPrisma.event.create.mockRejectedValue(dbError);

        const result = await eventResolvers.Mutation.logEvent(
          undefined,
          { input: mockInput },
          mockContext
        );

        expect(result).toEqual({
          success: false,
          message: "Database constraint violation",
        });
      });
     
      it("should handle getCurrentUserId failure", async () => {
        const authError = new Error("User not authenticated");
        (getCurrentUserId as any).mockRejectedValue(authError);

        await expect(
          eventResolvers.Mutation.logEvent(undefined, { input: mockInput }, mockContext)
        ).rejects.toThrow("User not authenticated");

        expect(mockPrisma.event.create).not.toHaveBeenCalled();
      });

      it("should handle getCurrentUserRoleId failure", async () => {
        const roleError = new Error("Role not found");
        (getCurrentUserRoleId as any).mockRejectedValue(roleError);

        await expect(
          eventResolvers.Mutation.logEvent(undefined, { input: mockInput }, mockContext)
        ).rejects.toThrow("Role not found");

        expect(mockPrisma.event.create).not.toHaveBeenCalled();
      });

      it("should handle missing optional fields", async () => {
        const minimalInput = {
          eventType: "MINIMAL",
          logLevel: "INFO",
          route: "/api/minimal",
          eventData: {},
        };

        mockPrisma.event.create.mockResolvedValue({});

        const result = await eventResolvers.Mutation.logEvent(
          undefined,
          { input: minimalInput },
          mockContext
        );

        expect(mockPrisma.event.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            eventType: "MINIMAL",
            logLevel: "INFO",
            withRoleId: "demos-admin",
            route: "/api/minimal",
            eventData: {
              userId: "user-1",
              roleId: "demos-admin",
            },
          },
        });

        expect(result).toEqual({ success: true });
      });

      it("should handle different log levels", async () => {
        const logLevels = ["DEBUG", "INFO", "WARN", "ERROR"];
        mockPrisma.event.create.mockResolvedValue({});

        for (const logLevel of logLevels) {
          const input = {
            eventType: "TEST",
            logLevel,
            route: "/api/test",
            eventData: { level: logLevel },
          };

          await eventResolvers.Mutation.logEvent(
            undefined,
            { input },
            mockContext
          );

          expect(mockPrisma.event.create).toHaveBeenLastCalledWith({
            data: {
              userId: "user-1",
              eventType: "TEST",
              logLevel,
              withRoleId: "demos-admin",
              route: "/api/test",
              eventData: {
                level: logLevel,
                userId: "user-1",
                roleId: "demos-admin",
              },
            },
          });
        }
      });

      it("should handle various event types", async () => {
        const eventTypes = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "ERROR"];
        mockPrisma.event.create.mockResolvedValue({});

        for (const eventType of eventTypes) {
          const input = {
            eventType,
            logLevel: "INFO",
            route: "/api/test",
            eventData: { type: eventType },
          };

          await eventResolvers.Mutation.logEvent(
            undefined,
            { input },
            mockContext
          );

          expect(mockPrisma.event.create).toHaveBeenLastCalledWith({
            data: {
              userId: "user-1",
              eventType,
              logLevel: "INFO",
              withRoleId: "demos-admin",
              route: "/api/test",
              eventData: {
                type: eventType,
                userId: "user-1",
                roleId: "demos-admin",
              },
            },
          });
        }
      });
    });
  });

  describe("Event field resolvers", () => {
    describe("user", () => {
      const mockEvent: Event = {
        id: "event-1",
        userId: "user-1",
        eventType: "TEST",
        logLevel: "INFO",
        withRoleId: "demos-admin",
        route: "/api/test",
        eventData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should return user when userId exists", async () => {
        const mockUser = {
          id: "user-1",
          username: "testuser",
          cognitoSubject: "cognito-123",
          personTypeId: "demos-admin",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await eventResolvers.Event.user(mockEvent);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: "user-1" },
        });

        expect(result).toEqual(mockUser);
      });

      it("should return null when userId is null", async () => {
        const eventWithoutUser: Event = {
          ...mockEvent,
          userId: null,
        };

        const result = await eventResolvers.Event.user(eventWithoutUser);

        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it("should return null when userId is undefined", async () => {
        const eventWithUndefinedUser: Event = {
          ...mockEvent,
          userId: undefined as any,
        };

        const result = await eventResolvers.Event.user(eventWithUndefinedUser);

        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it("should return null when user not found in database", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await eventResolvers.Event.user(mockEvent);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: "user-1" },
        });

        expect(result).toBeNull();
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.user.findUnique.mockRejectedValue(dbError);

        await expect(eventResolvers.Event.user(mockEvent)).rejects.toThrow(
          "Database connection failed"
        );
      });
    });

    describe("withRole", () => {
      it("should return withRoleId from event", async () => {
        const mockEvent: Event = {
          id: "event-1",
          userId: "user-1",
          eventType: "TEST",
          logLevel: "INFO",
          withRoleId: "demos-admin",
          route: "/api/test",
          eventData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await eventResolvers.Event.withRole(mockEvent);

        expect(result).toBe("demos-admin");
      });

      it("should return null when withRoleId is null", async () => {
        const mockEvent: Event = {
          id: "event-1",
          userId: "user-1",
          eventType: "TEST",
          logLevel: "INFO",
          withRoleId: null,
          route: "/api/test",
          eventData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await eventResolvers.Event.withRole(mockEvent);

        expect(result).toBeNull();
      });

      it("should return undefined when withRoleId is undefined", async () => {
        const mockEvent: Event = {
          id: "event-1",
          userId: "user-1",
          eventType: "TEST",
          logLevel: "INFO",
          withRoleId: undefined as any,
          route: "/api/test",
          eventData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await eventResolvers.Event.withRole(mockEvent);

        expect(result).toBeUndefined();
      });

      it("should handle different role types", async () => {
        const roles = ["demos-admin", "demos-cms-user", "demos-state-user", "non-user-contact"];

        for (const role of roles) {
          const mockEvent: Event = {
            id: "event-1",
            userId: "user-1",
            eventType: "TEST",
            logLevel: "INFO",
            withRoleId: role,
            route: "/api/test",
            eventData: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await eventResolvers.Event.withRole(mockEvent);

          expect(result).toBe(role);
        }
      });
    });
  });

  describe("Edge cases and error scenarios", () => {
    it("should handle malformed event data gracefully", async () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      (getCurrentUserId as any).mockResolvedValue("user-1");
      (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");

      const inputWithMalformedData = {
        eventType: "MALFORMED",
        logLevel: "ERROR",
        route: "/api/malformed",
        eventData: {
          circular: {},
          function: () => {},
          symbol: Symbol("test"),
          bigint: BigInt(123),
        },
      };

      // Create circular reference
      inputWithMalformedData.eventData.circular = inputWithMalformedData.eventData;

      mockPrisma.event.create.mockResolvedValue({});

      const result = await eventResolvers.Mutation.logEvent(
        undefined,
        { input: inputWithMalformedData },
        mockContext
      );

      expect(result).toEqual({ success: true });
    });

    it("should handle very large event data", async () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      (getCurrentUserId as any).mockResolvedValue("user-1");
      (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");

      const largeArray = new Array(1000).fill("large data item");
      const inputWithLargeData = {
        eventType: "LARGE_DATA",
        logLevel: "DEBUG",
        route: "/api/large",
        eventData: {
          largeArray,
          largeString: "x".repeat(10000),
          nestedObject: {
            level1: { level2: { level3: largeArray } },
          },
        },
      };

      mockPrisma.event.create.mockResolvedValue({});

      const result = await eventResolvers.Mutation.logEvent(
        undefined,
        { input: inputWithLargeData },
        mockContext
      );

      expect(result).toEqual({ success: true });
    });

    it("should handle empty strings and whitespace", async () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      (getCurrentUserId as any).mockResolvedValue("user-1");
      (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");

      const inputWithEmptyStrings = {
        eventType: "",
        logLevel: "   ",
        route: "\t\n",
        eventData: {
          empty: "",
          whitespace: "   ",
          tabs: "\t\t",
          newlines: "\n\n",
        },
      };

      mockPrisma.event.create.mockResolvedValue({});

      const result = await eventResolvers.Mutation.logEvent(
        undefined,
        { input: inputWithEmptyStrings },
        mockContext
      );

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          eventType: "",
          logLevel: "   ",
          withRoleId: "demos-admin",
          route: "\t\n",
          eventData: {
            empty: "",
            whitespace: "   ",
            tabs: "\t\t",
            newlines: "\n\n",
            userId: "user-1",
            roleId: "demos-admin",
          },
        },
      });

      expect(result).toEqual({ success: true });
    });

    it("should handle special characters in routes and event types", async () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      (getCurrentUserId as any).mockResolvedValue("user-1");
      (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");

      const inputWithSpecialChars = {
        eventType: "SPECIAL_CHARS_!@#$%^&*()",
        logLevel: "INFO",
        route: "/api/special-chars_123/test?param=value&other=test#fragment",
        eventData: {
          unicode: "🚀🌟✨",
          accents: "café naïve résumé",
          quotes: 'single "double" `backtick`',
        },
      };

      mockPrisma.event.create.mockResolvedValue({});

      const result = await eventResolvers.Mutation.logEvent(
        undefined,
        { input: inputWithSpecialChars },
        mockContext
      );

      expect(result).toEqual({ success: true });
    });

    it("should handle concurrent logging attempts", async () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      (getCurrentUserId as any).mockResolvedValue("user-1");
      (getCurrentUserRoleId as any).mockResolvedValue("demos-admin");
      mockPrisma.event.create.mockResolvedValue({});

      const inputs = Array.from({ length: 10 }, (_, i) => ({
        eventType: `CONCURRENT_${i}`,
        logLevel: "INFO",
        route: `/api/concurrent/${i}`,
        eventData: { index: i },
      }));

      const promises = inputs.map(input =>
        eventResolvers.Mutation.logEvent(undefined, { input }, mockContext)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual({ success: true });
      });

      expect(mockPrisma.event.create).toHaveBeenCalledTimes(10);
    });
  });
});