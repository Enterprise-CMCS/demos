import {
  Prisma,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectManyDeliverableDemonstrationTypes } from "./selectManyDeliverableDemonstrationTypes";
import { DeliverableDemonstrationTypeQueryResult } from ".";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDeliverableDemonstrationTypes", () => {
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

  const testDeliverableId = "deliverable-1";
  const testDeliverableId2 = "deliverable-2";
  const where: Prisma.DeliverableDemonstrationTypeWhereInput = {
    deliverableId: testDeliverableId,
  };
  const expectedCall = {
    where: { deliverableId: testDeliverableId },
    include: {
      demonstrationTypeTagAssignment: {
        include: {
          tag: true,
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get deliverableDemonstrationTypes and associated tags from the database directly if no transaction is given", async () => {
    await selectManyDeliverableDemonstrationTypes(where);
    expect(regularMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
  });

  it("should get deliverableDemonstrationTypes and associated tags via a transaction if one is given", async () => {
    await selectManyDeliverableDemonstrationTypes(where, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no deliverableDemonstrationTypes are found", async () => {
    regularMocks.deliverableDemonstrationType.findMany.mockResolvedValueOnce([]);
    const result = await selectManyDeliverableDemonstrationTypes(where);
    expect(regularMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual([]);
  });

  it("returns all deliverableDemonstrationTypes and associated tags that are found", async () => {
    const deliverableDemonstrationTypes = [
      {
        deliverableId: testDeliverableId,
        demonstrationTypeTagAssignment: {
          tagNameId: "tag-1",
          tag: {
            statusId: "Approved",
          },
        },
      },
      {
        deliverableId: testDeliverableId2,
        demonstrationTypeTagAssignment: {
          tagNameId: "tag-2",
          tag: {
            statusId: "Unapproved",
          },
        },
      },
    ] as DeliverableDemonstrationTypeQueryResult[];
    regularMocks.deliverableDemonstrationType.findMany.mockResolvedValueOnce(
      deliverableDemonstrationTypes
    );

    const result = await selectManyDeliverableDemonstrationTypes(where);
    expect(regularMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(deliverableDemonstrationTypes);
  });
});
