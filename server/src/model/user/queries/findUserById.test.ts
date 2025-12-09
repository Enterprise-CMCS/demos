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
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.user.findUniqueOrThrow).mockResolvedValue({
      id: testUserId,
      email: "test@example.com",
      role: "CMS_USER",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const expectedCall = {
      where: { id: testUserId },
    };

    await findUserById(mockTransaction, testUserId);
    expect(transactionMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
