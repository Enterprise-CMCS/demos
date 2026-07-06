import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteManyPersonStates } from "./deleteManyPersonStates";

describe("deleteManyPersonStates", () => {
  const transactionMocks = {
    personState: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    personState: {
      deleteMany: transactionMocks.personState.deleteMany,
    },
  } as any;
  const testPersonId = "person-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete person states from the database", async () => {
    const where = { personId: testPersonId };

    await deleteManyPersonStates(where, mockTransaction);
    expect(transactionMocks.personState.deleteMany).toHaveBeenCalledExactlyOnceWith({ where });
  });

  it("should throw an error if the person states cannot be deleted", async () => {
    const where = { personId: testPersonId };
    transactionMocks.personState.deleteMany.mockRejectedValueOnce("Prisma error :(");

    await expect(deleteManyPersonStates(where, mockTransaction)).rejects.toThrow("Prisma error :(");
    expect(transactionMocks.personState.deleteMany).toHaveBeenCalledExactlyOnceWith({ where });
  });
});
