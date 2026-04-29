import { Prisma, ApplicationTagSuggestion as PrismaApplicationTagSuggestion } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyApplicationTagSuggestions } from "./selectManyApplicationTagSuggestions";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationTagSuggestions", () => {
  const regularMocks = {
    applicationTagSuggestion: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationTagSuggestion: {
      findMany: regularMocks.applicationTagSuggestion.findMany,
    },
  };
  const transactionMocks = {
    applicationTagSuggestion: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagSuggestion: {
      findMany: transactionMocks.applicationTagSuggestion.findMany,
    },
  } as any;

  const testApplicationId = "application-1";
  const testApplicationId2 = "application-2";
  const where: Prisma.ApplicationTagSuggestionWhereInput = {
    applicationId: testApplicationId,
  };
  const expectedCall = {
    where: { applicationId: testApplicationId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get applicationTagSuggestions and associated tags from the database directly if no transaction is given", async () => {
    await selectManyApplicationTagSuggestions(where);
    expect(regularMocks.applicationTagSuggestion.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationTagSuggestion.findMany).not.toHaveBeenCalled();
  });

  it("should get applicationTagSuggestions and associated tags via a transaction if one is given", async () => {
    await selectManyApplicationTagSuggestions(where, mockTransaction);
    expect(regularMocks.applicationTagSuggestion.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.applicationTagSuggestion.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no applicationTagSuggestions are found", async () => {
    regularMocks.applicationTagSuggestion.findMany.mockResolvedValueOnce([]);
    const result = await selectManyApplicationTagSuggestions(where);
    expect(regularMocks.applicationTagSuggestion.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all applicationTagSuggestions and associated tags that are found", async () => {
    const applicationTagSuggestion = [
      { applicationId: testApplicationId },
      { applicationId: testApplicationId2 },
    ] as PrismaApplicationTagSuggestion[];
    regularMocks.applicationTagSuggestion.findMany.mockResolvedValueOnce(applicationTagSuggestion);

    const result = await selectManyApplicationTagSuggestions(where);
    expect(regularMocks.applicationTagSuggestion.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationTagSuggestion);
  });
});
