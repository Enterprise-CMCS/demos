import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteDocumentById } from "../";

describe("deleteDocumentById", () => {
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

  it("should delete document by id from the database", async () => {
    const expectedCall = {
      where: { id: testDocumentId },
    };

    await deleteDocumentById(mockTransaction, testDocumentId);
    expect(transactionMocks.document.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
