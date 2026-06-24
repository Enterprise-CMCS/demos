// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { insertPerson } from "./insertPerson";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertPerson", () => {
  // Test inputs
  const testInput: Prisma.PersonUncheckedCreateInput = {
    personTypeId: "demos-admin",
    email: "ada.lovelace@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
  };

  // Mock return values
  const regularMocks = {
    person: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    person: {
      create: regularMocks.person.create,
    },
  };

  const transactionMocks = {
    person: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    person: {
      create: transactionMocks.person.create,
    },
  } as any;

  // Expected call
  const expectedCall = {
    data: testInput,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert using a new client if no transaction is given", async () => {
    await insertPerson(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.person.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.person.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertPerson(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.person.create).not.toHaveBeenCalled();
    expect(transactionMocks.person.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
