import { ApplicationTagSuggestion as PrismaApplicationTagSuggestion } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectApplicationTagSuggestion } from "./selectApplicationTagSuggestion";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectApplicationTagSuggestion", () => {
  const regularMocks = {
    applicationTagSuggestion: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationTagSuggestion: {
      findAtMostOne: regularMocks.applicationTagSuggestion.findAtMostOne,
    },
  };
  const transactionMocks = {
    applicationTagSuggestion: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagSuggestion: {
      findAtMostOne: transactionMocks.applicationTagSuggestion.findAtMostOne,
    },
  } as any;

  const testApplicationId = "application-1";
  const where = {
    applicationId: testApplicationId,
  };
  const expectedCall = {
    where: { applicationId: testApplicationId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get applicationTagSuggestion and associated tags from the database directly if no transaction is given", async () => {
    await selectApplicationTagSuggestion(where);
    expect(regularMocks.applicationTagSuggestion.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationTagSuggestion.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get applicationTagSuggestion and associated tags via a transaction if one is given", async () => {
    await selectApplicationTagSuggestion(where, mockTransaction);
    expect(regularMocks.applicationTagSuggestion.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.applicationTagSuggestion.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no applicationTagSuggestion is found", async () => {
    regularMocks.applicationTagSuggestion.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectApplicationTagSuggestion(where);
    expect(regularMocks.applicationTagSuggestion.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns applicationTagSuggestion and associated tags that is found", async () => {
    const applicationTagSuggestion = {
      applicationId: testApplicationId,
    } as PrismaApplicationTagSuggestion;
    regularMocks.applicationTagSuggestion.findAtMostOne.mockResolvedValueOnce(
      applicationTagSuggestion
    );

    const result = await selectApplicationTagSuggestion(where);
    expect(regularMocks.applicationTagSuggestion.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationTagSuggestion);
  });
});
