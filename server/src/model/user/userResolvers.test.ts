import { describe, it, expect, vi, beforeEach } from "vitest";
import { User as PrismaUser } from "@prisma/client";
import type { GraphQLContext } from "../../auth/auth.util.js";
import {
  queryCurrentUser,
  resolvePerson,
  resolveEvents,
  resolveOwnedDocuments,
} from "./userResolvers";

// Mock imports
import { prisma } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("userResolvers", () => {
  const regularMocks = {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    person: {
      findUniqueOrThrow: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      findUniqueOrThrow: regularMocks.user.findUniqueOrThrow,
    },
    person: {
      findUniqueOrThrow: regularMocks.person.findUniqueOrThrow,
    },
    event: {
      findMany: regularMocks.event.findMany,
    },
    document: {
      findMany: regularMocks.document.findMany,
    },
  };
  const testUserId = "1b5967a6-97f8-4fbb-9bc1-f8666406fbd4";
  const testParent: Partial<PrismaUser> = {
    id: testUserId,
  };
  const testContextWithUser: GraphQLContext = {
    user: {
      id: testUserId,
      sub: "a-user-sub",
      role: "cms-admin",
    },
  };
  const testContextWithoutUser: GraphQLContext = {
    user: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("queryCurrentUser", () => {
    it("should query the user found in the GQL context", async () => {
      const expectedCall = {
        where: {
          id: testUserId,
        },
      };

      await queryCurrentUser(undefined, undefined, testContextWithUser);
      expect(regularMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });

    it("should skip the query and return null if the user context is missing", async () => {
      const result = await queryCurrentUser(undefined, undefined, testContextWithoutUser);
      expect(result).toBeNull();
      expect(regularMocks.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  describe("resolvePerson", () => {
    it("should query the person record for the parent", async () => {
      const expectedCall = {
        where: {
          id: testUserId,
        },
      };

      await resolvePerson(testParent as PrismaUser);
      expect(regularMocks.person.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("resolveEvents", () => {
    it("should query the events for the parent", async () => {
      const expectedCall = {
        where: {
          userId: testUserId,
        },
      };

      await resolveEvents(testParent as PrismaUser);
      expect(regularMocks.event.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("resolveOwnedDocuments", () => {
    it("should query the owned docuemnts for the parent", async () => {
      const expectedCall = {
        where: {
          ownerUserId: testUserId,
        },
      };

      await resolveOwnedDocuments(testParent as PrismaUser);
      expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});
