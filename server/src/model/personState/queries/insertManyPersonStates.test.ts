import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertManyPersonStates } from "./insertManyPersonStates";

describe("insertManyPersonStates", () => {
  const transactionMocks = {
    personState: {
      createMany: vi.fn(),
    },
  };
  const mockTransaction = {
    personState: {
      createMany: transactionMocks.personState.createMany,
    },
  } as any;
  const testPersonStates = [
    {
      personId: "person-123-456",
      stateId: "NY",
    },
    {
      personId: "person-123-456",
      stateId: "CA",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should insert person states into the database", async () => {
    const data = testPersonStates;

    await insertManyPersonStates(data, mockTransaction);
    expect(transactionMocks.personState.createMany).toHaveBeenCalledExactlyOnceWith({ data });
  });

  it("should throw an error if the person states cannot be inserted", async () => {
    const data = testPersonStates;
    transactionMocks.personState.createMany.mockRejectedValueOnce("Prisma error :(");

    await expect(insertManyPersonStates(data, mockTransaction)).rejects.toThrow("Prisma error :(");
    expect(transactionMocks.personState.createMany).toHaveBeenCalledExactlyOnceWith({ data });
  });
});
