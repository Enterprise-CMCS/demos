import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser } from "./getUser";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getUser", () => {
  const regularMocks = {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      findUniqueOrThrow: regularMocks.user.findUniqueOrThrow,
    },
  };
  const transactionMocks = {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    user: {
      findUniqueOrThrow: transactionMocks.user.findUniqueOrThrow,
    },
  } as any;
  const testUserId = "02f17162-0a26-4164-9c55-b7422cbf6006";
  const expectedCall = {
    where: { id: testUserId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the user by ID from the database directly if no transaction is given", async () => {
    await getUser({ id: testUserId });
    expect(regularMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get the user by ID from the database via a transaction if one is given", async () => {
    await getUser({ id: testUserId }, mockTransaction);
    expect(regularMocks.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
