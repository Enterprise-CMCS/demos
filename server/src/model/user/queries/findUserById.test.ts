import { describe, it, expect, vi, beforeEach } from "vitest";
import { findUserById } from "../";

describe("findUserById", () => {
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
  const testUserId = "user-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should get user by id from the database", async () => {
    const expectedCall = {
      where: { id: testUserId },
    };

    await findUserById(mockTransaction, testUserId);
    expect(transactionMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
