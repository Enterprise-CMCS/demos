import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma } from "@prisma/client";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { insertManyPersonStates } from "./insertManyPersonStates";
import { prisma } from "../../../prismaClient";

describe("insertManyPersonStates", () => {
  const testPersonStates: Prisma.PersonStateCreateManyInput[] = [
    {
      personId: "person-123-456",
      stateId: "NY",
    },
    {
      personId: "person-123-456",
      stateId: "CA",
    },
  ];

  const regularMocks = {
    personState: {
      createMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    personState: {
      createMany: regularMocks.personState.createMany,
    },
  };

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
  const expectedCall = { data: testPersonStates };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert person states using a new client if no transaction is given", async () => {
    await insertManyPersonStates(testPersonStates);

    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.personState.createMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.personState.createMany).not.toHaveBeenCalled();
  });

  it("should insert person states using an existing client if provided", async () => {
    await insertManyPersonStates(testPersonStates, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.personState.createMany).not.toHaveBeenCalled();
    expect(transactionMocks.personState.createMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should throw an error if the person states cannot be inserted", async () => {
    transactionMocks.personState.createMany.mockRejectedValueOnce("Prisma error :(");

    await expect(insertManyPersonStates(testPersonStates, mockTransaction)).rejects.toThrow(
      "Prisma error :("
    );
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.personState.createMany).not.toHaveBeenCalled();
    expect(transactionMocks.personState.createMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
