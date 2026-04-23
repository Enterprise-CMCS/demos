// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { TagStatus } from "../../../types";
import { GetDeliverableDemonstrationTypeResult } from "..";

// Functions under test
import { getDeliverableDemonstrationTypes } from "./getDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("getDeliverableDemonstrationTypes", () => {
  const regularMocks = {
    deliverableDemonstrationType: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableDemonstrationType: {
      findMany: regularMocks.deliverableDemonstrationType.findMany,
    },
  };
  const transactionMocks = {
    deliverableDemonstrationType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableDemonstrationType: {
      findMany: transactionMocks.deliverableDemonstrationType.findMany,
    },
  } as any;
  const testDeliverableId = "c8697763-fdd8-4502-b538-9e3cde153b05";
  const expectedCall = {
    where: { deliverableId: testDeliverableId },
    select: {
      demonstrationTypeTagNameId: true,
      demonstrationTypeTagAssignment: {
        select: {
          tag: {
            select: {
              statusId: true,
            },
          },
        },
      },
    },
  };
  const mockReturnValue = [
    {
      demonstrationTypeTagNameId: "Free Insulin",
      demonstrationTypeTagAssignment: {
        tag: {
          statusId: "Approved",
        },
      },
    },
    {
      demonstrationTypeTagNameId: "Reduced Cost Insulin Pump Supplies",
      demonstrationTypeTagAssignment: {
        tag: {
          statusId: "Unapproved",
        },
      },
    },
  ];
  const expectedResult: GetDeliverableDemonstrationTypeResult[] = [
    {
      tagName: "Free Insulin",
      approvalStatus: "Approved",
    },
    {
      tagName: "Reduced Cost Insulin Pump Supplies",
      approvalStatus: "Unapproved",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(mockPrismaClient.deliverableDemonstrationType.findMany).mockResolvedValue(
      mockReturnValue
    );
    vi.mocked(mockTransaction.deliverableDemonstrationType.findMany).mockResolvedValue(
      mockReturnValue
    );
  });

  it("should get the deliverable demonstration types directly from the database directly if no transaction is given", async () => {
    const result = await getDeliverableDemonstrationTypes(testDeliverableId);
    expect(result).toStrictEqual(expectedResult);
    expect(regularMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
  });

  it("should get the deliverable demonstration types via a transaction if one is given", async () => {
    const result = await getDeliverableDemonstrationTypes(testDeliverableId, mockTransaction);
    expect(result).toStrictEqual(expectedResult);
    expect(regularMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
