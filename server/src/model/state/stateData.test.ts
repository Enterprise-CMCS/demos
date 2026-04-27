import { State as PrismaState, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getState, getManyStates } from "./stateData";
import { selectState, selectManyStates } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectState: vi.fn(),
  selectManyStates: vi.fn(),
}));

describe("stateData", () => {
  const where: Prisma.StateWhereInput = {
    id: "NC",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getState", () => {
    it("queries for a single state", async () => {
      const state = { id: "NC" } as PrismaState;
      vi.mocked(selectState).mockResolvedValueOnce(state);

      const result = await getState(where);

      expect(selectState).toHaveBeenCalledExactlyOnceWith(where, undefined);
      expect(result).toBe(state);
    });

    it("passes transaction client to selectState if provided", async () => {
      const mockTransactionClient = {} as any;

      await getState(where, mockTransactionClient);
      expect(selectState).toHaveBeenCalledExactlyOnceWith(where, mockTransactionClient);
    });
  });

  describe("getManyStates", () => {
    it("queries for many states", async () => {
      const states = [{ id: "NC" }, { id: "SC" }] as PrismaState[];
      vi.mocked(selectManyStates).mockResolvedValueOnce(states);

      const result = await getManyStates(where);
      expect(selectManyStates).toHaveBeenCalledExactlyOnceWith(where, undefined);
      expect(result).toBe(states);
    });

    it("passes transaction client to selectManyDemonstrations if provided", async () => {
      const mockTransactionClient = {} as any;

      await getManyStates(where, mockTransactionClient);
      expect(selectManyStates).toHaveBeenCalledExactlyOnceWith(where, mockTransactionClient);
    });
  });
});
