import { Document as PrismaDocument } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { updateDocument } from "./updateDocument";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("updateDocument", () => {
  const regularMocks = {
    document: {
      update: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      update: regularMocks.document.update,
    },
  };
  const transactionMocks = {
    document: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      update: transactionMocks.document.update,
    },
  } as any;

  const testDocumentId = "document-1";
  const where = {
    id: testDocumentId,
  };
  const data = {
    name: "Updated Document Name",
  };
  const expectedCall = {
    where: { id: testDocumentId },
    data: {
      name: "Updated Document Name",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should update document directly if no transaction is given", async () => {
    await updateDocument(where, data);
    expect(regularMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.document.update).not.toHaveBeenCalled();
  });

  it("should update document via a transaction if one is given", async () => {
    await updateDocument(where, data, mockTransaction);
    expect(regularMocks.document.update).not.toHaveBeenCalled();
    expect(transactionMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("throws error when document cannot be found", async () => {
    regularMocks.document.update.mockRejectedValueOnce("Prisma error :(");
    expect(updateDocument(where, data)).rejects.toThrow("Prisma error :(");
    expect(regularMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("updates and returns the document", async () => {
    const document = { id: testDocumentId } as PrismaDocument;
    regularMocks.document.update.mockResolvedValueOnce({
      ...document,
      name: "Updated Document Name",
    } as PrismaDocument);

    const result = await updateDocument(where, data);
    expect(regularMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toStrictEqual({ ...document, name: "Updated Document Name" });
  });
});
