import { Document as PrismaDocument } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyDocuments } from "./selectManyDocuments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDocuments", () => {
  const regularMocks = {
    document: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findMany: regularMocks.document.findMany,
    },
  };
  const transactionMocks = {
    document: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findMany: transactionMocks.document.findMany,
    },
  } as any;

  const testDocumentId = "document-1";
  const testDocumentId2 = "document-2";
  const where = {
    id: testDocumentId,
  };
  const expectedCall = {
    where: { id: testDocumentId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get documents from the database directly if no transaction is given", async () => {
    await selectManyDocuments(where);
    expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.document.findMany).not.toHaveBeenCalled();
  });

  it("should get documents via a transaction if one is given", async () => {
    await selectManyDocuments(where, mockTransaction);
    expect(regularMocks.document.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no documents are found", async () => {
    regularMocks.document.findMany.mockResolvedValueOnce([]);
    const result = await selectManyDocuments(where);
    expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all documents that are found", async () => {
    const documents = [{ id: testDocumentId }, { id: testDocumentId2 }] as PrismaDocument[];
    regularMocks.document.findMany.mockResolvedValueOnce(documents);

    const result = await selectManyDocuments(where);
    expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(documents);
  });
});
