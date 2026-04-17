import { describe, it, expect, vi, beforeEach } from "vitest";
import { User as PrismaUser } from "@prisma/client";
import type { GraphQLContext } from "../../auth/auth.util.js";
import { queryCurrentUser, resolvePerson, resolveEvents, userResolvers } from "./userResolvers";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { getManyDocuments } from "../document/documentData.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("../document/documentData.js", () => ({
  getManyDocuments: vi.fn(),
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
  };
  const testUserId = "1b5967a6-97f8-4fbb-9bc1-f8666406fbd4";
  const testParent: Partial<PrismaUser> = {
    id: testUserId,
  };
  const mockContext: GraphQLContext = {
    user: {
      id: testUserId,
    },
  } as GraphQLContext;

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

      await queryCurrentUser(undefined, undefined, mockContext);
      expect(regularMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
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

  it("delegates `User.ownedDocuments` to `documentData.getManyDocuments`", async () => {
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
