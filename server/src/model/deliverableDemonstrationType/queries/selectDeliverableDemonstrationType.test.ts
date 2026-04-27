import {
  Deliverable,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectDeliverableDemonstrationType } from "./selectDeliverableDemonstrationType";
import { DeliverableDemonstrationTypeQueryResult } from ".";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDeliverableDemonstrationType", () => {
  const regularMocks = {
    deliverableDemonstrationType: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableDemonstrationType: {
      findAtMostOne: regularMocks.deliverableDemonstrationType.findAtMostOne,
    },
  };
  const transactionMocks = {
    deliverableDemonstrationType: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableDemonstrationType: {
      findAtMostOne: transactionMocks.deliverableDemonstrationType.findAtMostOne,
    },
  } as any;

  const testDeliverableId = "deliverable-1";
  const where = {
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

  it("should get deliverableDemonstrationType and associated tags from the database directly if no transaction is given", async () => {
    await selectDeliverableDemonstrationType(where);
    expect(regularMocks.deliverableDemonstrationType.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableDemonstrationType.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get deliverableDemonstrationType and associated tags via a transaction if one is given", async () => {
    await selectDeliverableDemonstrationType(where, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.findAtMostOne).not.toHaveBeenCalled();
    expect(
      transactionMocks.deliverableDemonstrationType.findAtMostOne
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no deliverableDemonstrationType is found", async () => {
    regularMocks.deliverableDemonstrationType.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectDeliverableDemonstrationType(where);
    expect(regularMocks.deliverableDemonstrationType.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBeNull();
  });

  it("returns deliverableDemonstrationType and associated tags that is found", async () => {
    const deliverableDemonstrationType = {
      deliverableId: testDeliverableId,
      demonstrationTypeTagAssignment: {
        tagNameId: "tag-1",
        tag: {
          statusId: "Approved",
        },
      },
    } as DeliverableDemonstrationTypeQueryResult;
    regularMocks.deliverableDemonstrationType.findAtMostOne.mockResolvedValueOnce(
      deliverableDemonstrationType
    );

    const result = await selectDeliverableDemonstrationType(where);
    expect(regularMocks.deliverableDemonstrationType.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toBe(deliverableDemonstrationType);
  });
});
