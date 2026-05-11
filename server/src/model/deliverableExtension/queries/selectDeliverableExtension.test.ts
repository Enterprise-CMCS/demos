// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectDeliverableExtension } from "./selectDeliverableExtension";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectDeliverableExtension", () => {
  const regularMocks = {
    deliverableExtension: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableExtension: {
      findAtMostOne: regularMocks.deliverableExtension.findAtMostOne,
    },
  };
  const transactionMocks = {
    deliverableExtension: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableExtension: {
      findAtMostOne: transactionMocks.deliverableExtension.findAtMostOne,
    },
  } as any;

  const testInput = { id: "2b8638ad-8ce3-46de-a313-7c9c5a44ceda" };

  const expectedCall = {
    where: testInput,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get a deliverable extension from the database directly if no transaction is given", async () => {
    await selectDeliverableExtension(testInput, false);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableExtension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableExtension.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get a deliverable extension via a transaction if one is given", async () => {
    await selectDeliverableExtension(testInput, false, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableExtension.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableExtension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should throw if a result is expected and not returned", async () => {
    try {
      await selectDeliverableExtension(testInput, true);
      throw new Error("Expected selectDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      const error = e as Error;
      expect(error.message).toBe(
        "Expected selectDeliverableExtension to return a record but it did not! " +
          'Where clause: {"id":"2b8638ad-8ce3-46de-a313-7c9c5a44ceda"}'
      );
    }
  });
});
