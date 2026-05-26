import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectApplicationDate } from "./selectApplicationDate";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectApplicationDate", () => {
  const regularMocks = {
    applicationDate: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationDate: {
      findAtMostOne: regularMocks.applicationDate.findAtMostOne,
    },
  };
  const transactionMocks = {
    applicationDate: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      findAtMostOne: transactionMocks.applicationDate.findAtMostOne,
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

  it("should get applicationDate from the database directly if no transaction is given", async () => {
    await selectApplicationDate(where);
    expect(regularMocks.applicationDate.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.applicationDate.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get applicationDate via a transaction if one is given", async () => {
    await selectApplicationDate(where, mockTransaction);
    expect(regularMocks.applicationDate.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.applicationDate.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no applicationDate is found", async () => {
    regularMocks.applicationDate.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectApplicationDate(where);
    expect(regularMocks.applicationDate.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns applicationDate that is found", async () => {
    const applicationDate = { applicationId: testApplicationId } as PrismaApplicationDate;
    regularMocks.applicationDate.findAtMostOne.mockResolvedValueOnce(applicationDate);

    const result = await selectApplicationDate(where);
    expect(regularMocks.applicationDate.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(applicationDate);
  });
});
