import { Document as PrismaDocument } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectDocument } from "./selectDocument";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDocument", () => {
  const documentFindAtMostOne = vi.fn();

  const mockPrismaClient = {
    document: {
      findAtMostOne: documentFindAtMostOne,
    },
  };

  const mockTransaction = {
    document: {
      findAtMostOne: vi.fn(),
    },
  } as unknown as PrismaTransactionClient;

  const where = {
    id: "document-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("uses the default prisma client when no transaction client is provided", async () => {
    const document = { id: "document-1" } as PrismaDocument;
    documentFindAtMostOne.mockResolvedValueOnce(document);

    const result = await selectDocument(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(documentFindAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(document);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const document = { id: "document-1" } as PrismaDocument;
    mockTransaction.document.findAtMostOne = vi.fn().mockResolvedValueOnce(document);

    const result = await selectDocument(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.document.findAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(document);
  });

  it("returns null when no document is found", async () => {
    documentFindAtMostOne.mockResolvedValueOnce(null);

    const result = await selectDocument(where);

    expect(result).toBeNull();
  });
});
