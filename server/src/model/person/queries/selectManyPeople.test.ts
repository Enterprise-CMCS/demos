import { Person as PrismaPerson } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyPeople } from "./selectManyPeople";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyPeople", () => {
  const regularMocks = {
    person: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    person: {
      findMany: regularMocks.person.findMany,
    },
  };
  const transactionMocks = {
    person: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    person: {
      findMany: transactionMocks.person.findMany,
    },
  } as any;

  const testPersonId = "person-1";
  const testPersonId2 = "person-2";
  const where = {
    id: testPersonId,
  };
  const expectedCall = {
    where: { id: testPersonId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get people from the database directly if no transaction is given", async () => {
    await selectManyPeople(where);
    expect(regularMocks.person.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.person.findMany).not.toHaveBeenCalled();
  });

  it("should get people via a transaction if one is given", async () => {
    await selectManyPeople(where, mockTransaction);
    expect(regularMocks.person.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.person.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no people are found", async () => {
    regularMocks.person.findMany.mockResolvedValueOnce([]);
    const result = await selectManyPeople(where);
    expect(regularMocks.person.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all people that are found", async () => {
    const people = [{ id: testPersonId }, { id: testPersonId2 }] as PrismaPerson[];
    regularMocks.person.findMany.mockResolvedValueOnce(people);

    const result = await selectManyPeople(where);
    expect(regularMocks.person.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(people);
  });
});
