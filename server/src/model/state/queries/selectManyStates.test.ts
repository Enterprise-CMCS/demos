import { State as PrismaState } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyStates } from "./selectManyStates";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyStates", () => {
  const regularMocks = {
    state: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    state: {
      findMany: regularMocks.state.findMany,
    },
  };
  const transactionMocks = {
    state: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    state: {
      findMany: transactionMocks.state.findMany,
    },
  } as any;

  const testStateId = "state-1";
  const testStateId2 = "state-2";
  const where = {
    id: testStateId,
  };
  const expectedCall = {
    where: { id: testStateId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get states from the database directly if no transaction is given", async () => {
    await selectManyStates(where);
    expect(regularMocks.state.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.state.findMany).not.toHaveBeenCalled();
  });

  it("should get states via a transaction if one is given", async () => {
    await selectManyStates(where, mockTransaction);
    expect(regularMocks.state.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.state.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no states are found", async () => {
    regularMocks.state.findMany.mockResolvedValueOnce([]);
    const result = await selectManyStates(where);
    expect(regularMocks.state.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all states that are found", async () => {
    const states = [{ id: testStateId }, { id: testStateId2 }] as PrismaState[];
    regularMocks.state.findMany.mockResolvedValueOnce(states);

    const result = await selectManyStates(where);
    expect(regularMocks.state.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(states);
  });
});
