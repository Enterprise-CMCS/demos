// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { selectManyDeliverableActions } from "./selectManyDeliverableActions";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectManyDeliverableActions", () => {
  // Mock return values
  const regularMocks = {
    deliverableAction: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableAction: {
      findMany: regularMocks.deliverableAction.findMany,
    },
  };

  const transactionMocks = {
    deliverableAction: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableAction: {
      findMany: transactionMocks.deliverableAction.findMany,
    },
  } as any;

  // Expected calls
  const expectedUnfilteredCall = {
    where: {},
    include: {
      user: {
        include: {
          person: true,
        },
      },
      activeExtension: true,
    },
  };

  const expectedFilteredCall = {
    where: {
      id: "56e3b26d-f629-4bd2-b419-d4d4a5bb751b",
    },
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
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should select the deliverable action list using a new client if no transaction is given", async () => {
    const testInput = { id: "56e3b26d-f629-4bd2-b419-d4d4a5bb751b" };

    await selectManyDeliverableActions(testInput);
    expect(regularMocks.deliverableAction.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
    expect(transactionMocks.deliverableAction.findMany).not.toHaveBeenCalled();
  });

  it("should select the deliverable action list using an existing client if one is given", async () => {
    const testInput = { id: "56e3b26d-f629-4bd2-b419-d4d4a5bb751b" };

    await selectManyDeliverableActions(testInput, mockTransaction);
    expect(regularMocks.deliverableAction.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableAction.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
  });

  it("should default to an empty where if nothing is given", async () => {
    await selectManyDeliverableActions();
    expect(regularMocks.deliverableAction.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedUnfilteredCall
    );
    expect(transactionMocks.deliverableAction.findMany).not.toHaveBeenCalled();
  });
});
