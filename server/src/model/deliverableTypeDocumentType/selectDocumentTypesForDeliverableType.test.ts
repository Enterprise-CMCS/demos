// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import type { DeliverableTypeDocumentType as PrismaDeliverableTypeDocumentType } from "@prisma/client";

// Functions under test
import { selectDocumentTypesForDeliverableType } from "./selectDocumentTypesForDeliverableType";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../prismaClient";

describe("selectDocumentTypesForDeliverableType", () => {
  const regularMocks = {
    deliverableTypeDocumentType: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableTypeDocumentType: {
      findMany: regularMocks.deliverableTypeDocumentType.findMany,
    },
  };
  const transactionMocks = {
    deliverableTypeDocumentType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableTypeDocumentType: {
      findMany: transactionMocks.deliverableTypeDocumentType.findMany,
    },
  } as any;

  const testDeliverableTypeId = "deliverable-type-1";
  const expectedCall = {
    where: { deliverableTypeId: testDeliverableTypeId },
    select: { documentTypeId: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    regularMocks.deliverableTypeDocumentType.findMany.mockResolvedValue([]);
    transactionMocks.deliverableTypeDocumentType.findMany.mockResolvedValue([]);
  });

  it("should get document types from the database directly if no transaction is given", async () => {
    await selectDocumentTypesForDeliverableType(testDeliverableTypeId);
    expect(regularMocks.deliverableTypeDocumentType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableTypeDocumentType.findMany).not.toHaveBeenCalled();
  });

  it("should get document types via a transaction if one is given", async () => {
    await selectDocumentTypesForDeliverableType(testDeliverableTypeId, mockTransaction);
    expect(regularMocks.deliverableTypeDocumentType.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableTypeDocumentType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("returns an empty array when no document types are found", async () => {
    const result = await selectDocumentTypesForDeliverableType(testDeliverableTypeId);
    expect(result).toEqual([]);
  });

  it("returns the document type ids for the matching rows", async () => {
    const mockRows: Partial<PrismaDeliverableTypeDocumentType>[] = [
      { documentTypeId: "General File" },
      { documentTypeId: "BN Workbook" },
    ];
    regularMocks.deliverableTypeDocumentType.findMany.mockResolvedValueOnce(
      mockRows as PrismaDeliverableTypeDocumentType[]
    );

    const result = await selectDocumentTypesForDeliverableType(testDeliverableTypeId);
    expect(result).toEqual(mockRows.map((row) => row.documentTypeId));
  });
});
