// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectDeliverableAction } from "./selectDeliverableAction";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectDeliverableAction", () => {
  const regularMocks = {
    deliverableAction: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableAction: {
      findAtMostOne: regularMocks.deliverableAction.findAtMostOne,
    },
  };
  const transactionMocks = {
    deliverableAction: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableAction: {
      findAtMostOne: transactionMocks.deliverableAction.findAtMostOne,
    },
  } as any;

  const testInput = { id: "2b8638ad-8ce3-46de-a313-7c9c5a44ceda" };

  const expectedCall = {
    where: testInput,
    include: {
      user: {
        include: {
          person: true,
        },
      },
      activeExtension: true,
    }, 
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get a deliverable action from the database directly if no transaction is given", async () => {
    await selectDeliverableAction(testInput, false);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableAction.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableAction.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get a deliverable action via a transaction if one is given", async () => {
    await selectDeliverableAction(testInput, false, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableAction.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableAction.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should throw if a result is expected and not returned", async () => {
    try {
      await selectDeliverableAction(testInput, true);
      throw new Error("Expected selectDeliverableAction to throw, but it did not.");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      const error = e as Error;
      expect(error.message).toBe(
        "Expected selectDeliverableAction to return a record but it did not! " +
          'Where clause: {"id":"2b8638ad-8ce3-46de-a313-7c9c5a44ceda"}'
      );
    }
  });
});
