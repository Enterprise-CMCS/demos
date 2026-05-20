import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyApplicationTagSuggestionDetails } from "./selectManyApplicationTagSuggestionDetails";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationTagSuggestionDetails", () => {
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

  const where: Prisma.ApplicationTagSuggestionWhereInput = {
    applicationId: "application-1",
  };

  const expectedCall = {
    where,
    include: {
      extracts: {
        include: {
          uiPathValue: {
            include: {
              result: {
                include: {
                  document: true,
                },
              },
            },
          },
        },
        orderBy: [{ startPageNo: "asc" }],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("gets suggestion details from the database directly if no transaction is given", async () => {
    await selectManyApplicationTagSuggestionDetails(where);

    expect(
      regularMocks.applicationTagSuggestion.findMany,
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(
      transactionMocks.applicationTagSuggestion.findMany,
    ).not.toHaveBeenCalled();
  });

  it("gets suggestion details via a transaction if one is given", async () => {
    await selectManyApplicationTagSuggestionDetails(where, mockTransaction);

    expect(
      regularMocks.applicationTagSuggestion.findMany,
    ).not.toHaveBeenCalled();
    expect(
      transactionMocks.applicationTagSuggestion.findMany,
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
