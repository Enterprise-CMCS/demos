import { describe, it, expect, vi, beforeEach } from "vitest";

import { selectLastLoginForUser } from "./selectLastLoginForUser";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectLastLoginForUser", () => {
  const testUserId = "9a85bee6-9cb1-4714-af5d-ecc50ca3ff64";

  const mockLastLogin = new Date(2025, 11, 3, 1, 15, 22, 909);
  const regularMocks = {
    userSession: {
      aggregate: vi.fn(),
    },
  };
  const mockPrismaClient = {
    userSession: {
      aggregate: regularMocks.userSession.aggregate,
    },
  };
  const transactionMocks = {
    userSession: {
      aggregate: vi.fn(),
    },
  };
  const mockTransaction = {
    userSession: {
      aggregate: transactionMocks.userSession.aggregate,
    },
  };

  const expectedCall = {
    _max: {
      authTime: true,
    },
    where: {
      userId: testUserId,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should find the most recent login using a new client if no transaction is given", async () => {
    vi.mocked(regularMocks.userSession.aggregate).mockReturnValue({
      _max: {
        authTime: mockLastLogin,
      },
    });
    await selectLastLoginForUser(testUserId);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.userSession.aggregate).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.userSession.aggregate).not.toHaveBeenCalled();
  });

  it("should find the most recent login using a transaction if one is given", async () => {
    vi.mocked(transactionMocks.userSession.aggregate).mockReturnValue({
      _max: {
        authTime: mockLastLogin,
      },
    });
    await selectLastLoginForUser(testUserId, mockTransaction as any);
    expect(prisma).not.toHaveBeenCalledOnce();
    expect(regularMocks.userSession.aggregate).not.toHaveBeenCalled();
    expect(transactionMocks.userSession.aggregate).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return null if the aggregate is null", async () => {
    vi.mocked(regularMocks.userSession.aggregate).mockReturnValue({
      _max: {
        authTime: null,
      },
    });
    const result = await selectLastLoginForUser(testUserId);
    expect(result).toBeNull();
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.userSession.aggregate).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.userSession.aggregate).not.toHaveBeenCalled();
  });
});
