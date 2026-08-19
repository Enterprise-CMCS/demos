import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma } from "@prisma/client";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { deleteManyPersonStates } from "./deleteManyPersonStates";
import { prisma } from "../../../prismaClient";

describe("deleteManyPersonStates", () => {
  const testWhere: Prisma.PersonStateWhereInput = {
    personId: "person-123-456",
  };

  const regularMocks = {
    personState: {
      deleteMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    personState: {
      deleteMany: regularMocks.personState.deleteMany,
    },
  };

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
  const expectedCall = { where: testWhere };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should delete person states using a new client if no transaction is given", async () => {
    await deleteManyPersonStates(testWhere);

    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.personState.deleteMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.personState.deleteMany).not.toHaveBeenCalled();
  });

  it("should delete person states using an existing client if provided", async () => {
    await deleteManyPersonStates(testWhere, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.personState.deleteMany).not.toHaveBeenCalled();
    expect(transactionMocks.personState.deleteMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should throw an error if the person states cannot be deleted", async () => {
    transactionMocks.personState.deleteMany.mockRejectedValueOnce("Prisma error :(");

    await expect(deleteManyPersonStates(testWhere, mockTransaction)).rejects.toThrow(
      "Prisma error :("
    );
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.personState.deleteMany).not.toHaveBeenCalled();
    expect(transactionMocks.personState.deleteMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
