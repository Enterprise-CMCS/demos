import { Document as PrismaDocument } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectDocument } from "./selectDocument";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDocument", () => {
  const regularMocks = {
    document: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findAtMostOne: regularMocks.document.findAtMostOne,
    },
  };
  const transactionMocks = {
    document: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findAtMostOne: transactionMocks.document.findAtMostOne,
    },
  } as any;

  const testDocumentId = "document-1";
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

  it("should get document from the database directly if no transaction is given", async () => {
    await selectDocument(where);
    expect(regularMocks.document.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.document.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get document via a transaction if one is given", async () => {
    await selectDocument(where, mockTransaction);
    expect(regularMocks.document.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.document.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no document is found", async () => {
    regularMocks.document.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectDocument(where);
    expect(regularMocks.document.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns document that is found", async () => {
    const document = { id: testDocumentId } as PrismaDocument;
    regularMocks.document.findAtMostOne.mockResolvedValueOnce(document);

    const result = await selectDocument(where);
    expect(regularMocks.document.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(document);
  });
});
