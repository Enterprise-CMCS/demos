import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { upsertUserSession } from "./upsertUserSession";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("upsertUserSession", () => {
  const testUserId = "9a85bee6-9cb1-4714-af5d-ecc50ca3ff64";
  const testAuthTime = new Date(1778957412000);

  const mockCurrentTime = new Date(1779051072000);
  const regularMocks = {
    userSession: {
      upsert: vi.fn(),
    },
  };
  const mockPrismaClient = {
    userSession: {
      upsert: regularMocks.userSession.upsert,
    },
  };
  const transactionMocks = {
    userSession: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    userSession: {
      upsert: transactionMocks.userSession.upsert,
    },
  };

  const expectedCall = {
    where: {
      userId_authTime: {
        userId: testUserId,
        authTime: testAuthTime,
      },
    },
    create: {
      userId: testUserId,
      authTime: testAuthTime,
      lastAuthEventTime: testAuthTime,
      authEventCount: 1,
    },
    update: {
      lastAuthEventTime: mockCurrentTime,
      authEventCount: {
        increment: 1,
      },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentTime);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should upsert the session using a new client if no transaction is given", async () => {
    await upsertUserSession(testUserId, testAuthTime);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.userSession.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.userSession.upsert).not.toHaveBeenCalled();
  });

  it("should upsert the session using a transaction if one is given", async () => {
    await upsertUserSession(testUserId, testAuthTime, mockTransaction as any);
    expect(prisma).not.toHaveBeenCalledOnce();
    expect(regularMocks.userSession.upsert).not.toHaveBeenCalled();
    expect(transactionMocks.userSession.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
