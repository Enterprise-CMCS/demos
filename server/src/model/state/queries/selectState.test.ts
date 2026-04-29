import { State as PrismaState } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectState } from "./selectState";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectState", () => {
  const regularMocks = {
    state: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    state: {
      findAtMostOne: regularMocks.state.findAtMostOne,
    },
  };
  const transactionMocks = {
    state: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    state: {
      findAtMostOne: transactionMocks.state.findAtMostOne,
    },
  } as any;

  const testStateId = "state-1";
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

  it("should get state from the database directly if no transaction is given", async () => {
    await selectState(where);
    expect(regularMocks.state.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.state.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get state via a transaction if one is given", async () => {
    await selectState(where, mockTransaction);
    expect(regularMocks.state.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.state.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no state is found", async () => {
    regularMocks.state.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectState(where);
    expect(regularMocks.state.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns state that is found", async () => {
    const state = { id: testStateId } as PrismaState;
    regularMocks.state.findAtMostOne.mockResolvedValueOnce(state);

    const result = await selectState(where);
    expect(regularMocks.state.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(state);
  });
});
