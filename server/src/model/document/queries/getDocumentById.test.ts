import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDocumentById } from "../";

describe("getDocumentById", () => {
  const transactionMocks = {
    document: {
      findUnique: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findUnique: transactionMocks.document.findUnique,
    },
  } as any;
  const testDocumentId = "doc-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should get document by id from the database", async () => {
    const expectedCall = {
      where: { id: testDocumentId },
    };

    await getDocumentById(mockTransaction, testDocumentId);
    expect(transactionMocks.document.findUnique).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
