import { User as PrismaUser } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyUsers } from "./selectManyUsers";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyUsers", () => {
  const regularMocks = {
    user: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    user: {
      findMany: regularMocks.user.findMany,
    },
  };
  const transactionMocks = {
    user: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    user: {
      findMany: transactionMocks.user.findMany,
    },
  } as any;

  const testUserId = "user-1";
  const testUserId2 = "user-2";
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

  it("should get users from the database directly if no transaction is given", async () => {
    await selectManyUsers(where);
    expect(regularMocks.user.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.user.findMany).not.toHaveBeenCalled();
  });

  it("should get users via a transaction if one is given", async () => {
    await selectManyUsers(where, mockTransaction);
    expect(regularMocks.user.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.user.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no users are found", async () => {
    regularMocks.user.findMany.mockResolvedValueOnce([]);
    const result = await selectManyUsers(where);
    expect(regularMocks.user.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all users that are found", async () => {
    const users = [{ id: testUserId }, { id: testUserId2 }] as PrismaUser[];
    regularMocks.user.findMany.mockResolvedValueOnce(users);

    const result = await selectManyUsers(where);
    expect(regularMocks.user.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(users);
  });
});
