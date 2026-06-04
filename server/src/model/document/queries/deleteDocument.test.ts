import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteDocument } from "./deleteDocument";

describe("deleteDocument", () => {
  const transactionMocks = {
    document: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      delete: transactionMocks.document.delete,
    },
  } as any;
  const testDocumentId = "doc-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete document from the database", async () => {
    const where = { id: testDocumentId };

    await deleteDocument(where, mockTransaction);
    expect(transactionMocks.document.delete).toHaveBeenCalledExactlyOnceWith({ where });
  });
});
