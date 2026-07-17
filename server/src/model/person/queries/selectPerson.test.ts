import { Person as PrismaPerson } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectPerson } from "./selectPerson";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectPerson", () => {
  const regularMocks = {
    person: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    person: {
      findAtMostOne: regularMocks.person.findAtMostOne,
    },
  };
  const transactionMocks = {
    person: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    person: {
      findAtMostOne: transactionMocks.person.findAtMostOne,
    },
  } as any;

  const testPersonId = "person-1";
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

  it("should get person from the database directly if no transaction is given", async () => {
    await selectPerson(where);
    expect(regularMocks.person.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.person.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get person via a transaction if one is given", async () => {
    await selectPerson(where, mockTransaction);
    expect(regularMocks.person.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.person.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no person is found", async () => {
    regularMocks.person.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectPerson(where);
    expect(regularMocks.person.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns person that is found", async () => {
    const person = { id: testPersonId } as PrismaPerson;
    regularMocks.person.findAtMostOne.mockResolvedValueOnce(person);

    const result = await selectPerson(where);
    expect(regularMocks.person.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(person);
  });
});
