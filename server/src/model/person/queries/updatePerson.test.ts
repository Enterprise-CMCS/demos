// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { updatePerson } from "./updatePerson";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("updatePerson", () => {
  // Test inputs
  const testWhere: Prisma.PersonWhereUniqueInput = {
    id: "f6c2a0d1-7b3e-4a52-9c8f-1d4e5b6a7c89",
  };
  const testData: Prisma.PersonUncheckedUpdateInput = {
    firstName: "Ada",
    lastName: "Lovelace",
  };

  // Mock return values
  const regularMocks = {
    person: {
      update: vi.fn(),
    },
  };
  const mockPrismaClient = {
    person: {
      update: regularMocks.person.update,
    },
  };

  const transactionMocks = {
    person: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    person: {
      update: transactionMocks.person.update,
    },
  } as any;

  // Expected call
  const expectedCall = {
    where: testWhere,
    data: testData,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should update using a new client if no transaction is given", async () => {
    await updatePerson(testWhere, testData);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.person.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.person.update).not.toHaveBeenCalled();
  });

  it("should update using an existing client if provided", async () => {
    await updatePerson(testWhere, testData, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.person.update).not.toHaveBeenCalled();
    expect(transactionMocks.person.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
