import { describe, it, expect, vi, beforeEach } from "vitest";
import { User as PrismaUser } from "@prisma/client";
import type { GraphQLContext } from "../../auth";
import { resolveEvents, userResolvers } from "./userResolvers";

// Mock imports
import { prisma } from "../../prismaClient";
import { getManyDocuments } from "../document";
import { getUser } from "./userData";
import { getPerson } from "../person";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("./userData", () => ({
  getUser: vi.fn(),
}));

vi.mock("../person", () => ({
  getPerson: vi.fn(),
}));

describe("userResolvers", () => {
  const regularMocks = {
    event: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    event: {
      findMany: regularMocks.event.findMany,
    },
  };
  const testUserId = "abc123";
  const mockContext: GraphQLContext = {
    user: {
      id: testUserId,
    },
  } as GraphQLContext;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("Query.currentUser", () => {
    it("delegates to `userData.getUser`", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      await userResolvers.Query.currentUser(mockUser, undefined, mockContext);
      expect(getUser).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockContext.user);
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
    it("delegates to `personData.getPerson`", async () => {
      const mockUser = {
        id: "abc123",
      } as PrismaUser;
      await userResolvers.User.person(mockUser, undefined, mockContext);
      expect(getPerson).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
    });
  });

  describe("resolveEvents", () => {
    it("should query the events for the parent", async () => {
      const expectedCall = {
        where: {
          userId: testUserId,
        },
      };

      await resolveEvents({ id: "abc123" } as PrismaUser);
      expect(regularMocks.event.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});
