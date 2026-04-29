import { User as PrismaUser } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectUser } from "./selectUser";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectUser", () => {
  const regularMocks = {
    user: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      findAtMostOne: regularMocks.user.findAtMostOne,
    },
  };
  const transactionMocks = {
    user: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    user: {
      findAtMostOne: transactionMocks.user.findAtMostOne,
    },
  } as any;

  const testUserId = "user-1";
  const where = {
    id: testUserId,
  };
  const expectedCall = {
    where: { id: testUserId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get user from the database directly if no transaction is given", async () => {
    await selectUser(where);
    expect(regularMocks.user.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.user.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get user via a transaction if one is given", async () => {
    await selectUser(where, mockTransaction);
    expect(regularMocks.user.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.user.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no user is found", async () => {
    regularMocks.user.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectUser(where);
    expect(regularMocks.user.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns user that is found", async () => {
    const user = { id: testUserId } as PrismaUser;
    regularMocks.user.findAtMostOne.mockResolvedValueOnce(user);

    const result = await selectUser(where);
    expect(regularMocks.user.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(user);
  });
});
