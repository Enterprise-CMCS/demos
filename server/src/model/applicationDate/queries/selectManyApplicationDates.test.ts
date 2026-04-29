import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyApplicationDates } from "./selectManyApplicationDates";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyApplicationDates", () => {
  const regularMocks = {
    applicationDate: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationDate: {
      findMany: regularMocks.applicationDate.findMany,
    },
  };
  const transactionMocks = {
    applicationDate: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      findMany: transactionMocks.applicationDate.findMany,
    },
  } as any;

  const testApplicationId = "application-1";
  const testApplicationId2 = "application-2";
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

  it("should get applicationDates from the database directly if no transaction is given", async () => {
    await selectManyApplicationDates(where);
    expect(regularMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.applicationDate.findMany).not.toHaveBeenCalled();
  });

  it("should get applicationDates via a transaction if one is given", async () => {
    await selectManyApplicationDates(where, mockTransaction);
    expect(regularMocks.applicationDate.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no applicationDates are found", async () => {
    regularMocks.applicationDate.findMany.mockResolvedValueOnce([]);
    const result = await selectManyApplicationDates(where);
    expect(regularMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all applicationDates that are found", async () => {
    const applicationDates = [
      { applicationId: testApplicationId },
      { applicationId: testApplicationId2 },
    ] as PrismaApplicationDate[];
    regularMocks.applicationDate.findMany.mockResolvedValueOnce(applicationDates);

    const result = await selectManyApplicationDates(where);
    expect(regularMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(applicationDates);
  });
});
