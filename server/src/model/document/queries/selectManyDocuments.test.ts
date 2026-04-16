import { Document as PrismaDocument } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyDocuments } from "./selectManyDocuments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDocuments", () => {
  const documentFindMany = vi.fn();

  const mockPrismaClient = {
    document: {
      findMany: documentFindMany,
    },
  };

  const mockTransaction = {
    document: {
      findMany: vi.fn(),
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
    const documents = [{ id: "document-1" }, { id: "document-2" }] as PrismaDocument[];
    documentFindMany.mockResolvedValueOnce(documents);

    const result = await selectManyDocuments(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(documentFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(documents);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const documents = [{ id: "document-1" }, { id: "document-2" }] as PrismaDocument[];
    mockTransaction.document.findMany = vi.fn().mockResolvedValueOnce(documents);

    const result = await selectManyDocuments(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.document.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(documents);
  });

  it("returns an empty array when no documents are found", async () => {
    documentFindMany.mockResolvedValueOnce([]);

    const result = await selectManyDocuments(where);

    expect(result).toEqual([]);
  });

  it("returns all documents that are found", async () => {
    const documents = [{ id: "document-1" }, { id: "document-2" }] as PrismaDocument[];
    documentFindMany.mockResolvedValueOnce(documents);

    const result = await selectManyDocuments(where);

    expect(result).toBe(documents);
  });
});
