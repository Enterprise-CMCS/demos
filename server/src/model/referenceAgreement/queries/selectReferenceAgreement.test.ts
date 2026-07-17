// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { ReferenceAgreement as PrismaReferenceAgreement } from "@prisma/client";

// Functions under test
import { selectReferenceAgreement } from "./selectReferenceAgreement";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectReferenceAgreement", () => {
  const regularMocks = {
    referenceAgreement: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    referenceAgreement: {
      findAtMostOne: regularMocks.referenceAgreement.findAtMostOne,
    },
  };
  const transactionMocks = {
    referenceAgreement: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    referenceAgreement: {
      findAtMostOne: transactionMocks.referenceAgreement.findAtMostOne,
    },
  } as any;

  const testReferenceAgreementId = "reference-agreement-1";
  const testWhere = {
    id: testReferenceAgreementId,
  };
  const expectedCall = {
    where: testWhere,
    include: {
      _count: {
        select: {
          referenceConfigurations: {
            where: {
              statusId: "Active",
            },
          },
        },
      },
    },
  };

  const mockReferenceAgreementWithActiveUse: Partial<PrismaReferenceAgreement> & {
    _count: { referenceConfigurations: number };
  } = {
    id: testReferenceAgreementId,
    _count: { referenceConfigurations: 2 },
  };
  const mockReferenceAgreementWithoutActiveUse: Partial<PrismaReferenceAgreement> & {
    _count: { referenceConfigurations: number };
  } = {
    id: testReferenceAgreementId,
    _count: { referenceConfigurations: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    regularMocks.referenceAgreement.findAtMostOne.mockResolvedValue(
      mockReferenceAgreementWithActiveUse
    );
    transactionMocks.referenceAgreement.findAtMostOne.mockResolvedValue(
      mockReferenceAgreementWithActiveUse
    );
  });

  it("should get reference agreement from the database directly if no transaction is given", async () => {
    await selectReferenceAgreement(testWhere);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.referenceAgreement.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.referenceAgreement.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get reference agreement via a transaction if one is given", async () => {
    await selectReferenceAgreement(testWhere, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.referenceAgreement.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.referenceAgreement.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns null when no reference agreement is found", async () => {
    regularMocks.referenceAgreement.findAtMostOne.mockResolvedValueOnce(null);

    const result = await selectReferenceAgreement(testWhere);
    expect(result).toBeNull();
  });

  it("returns inActiveUse as true when referenceConfigurations count is greater than 0", async () => {
    regularMocks.referenceAgreement.findAtMostOne.mockResolvedValueOnce(
      mockReferenceAgreementWithActiveUse as PrismaReferenceAgreement
    );

    const result = await selectReferenceAgreement(testWhere);
    expect(result?.inActiveUse).toBe(true);
  });

  it("returns inActiveUse as false when referenceConfigurations count is 0", async () => {
    regularMocks.referenceAgreement.findAtMostOne.mockResolvedValueOnce(
      mockReferenceAgreementWithoutActiveUse as PrismaReferenceAgreement
    );

    const result = await selectReferenceAgreement(testWhere);
    expect(result?.inActiveUse).toBe(false);
  });
});
