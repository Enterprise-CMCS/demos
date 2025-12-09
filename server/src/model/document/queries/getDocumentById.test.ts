import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDocumentById } from "../";

describe("getDocumentById", () => {
  const transactionMocks = {
    document: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findUniqueOrThrow: transactionMocks.document.findUniqueOrThrow,
    },
  } as any;
  const testDocumentId = "doc-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should get document by id from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.document.findUniqueOrThrow).mockResolvedValue({
      id: testDocumentId,
      applicationId: "app-123-456",
      documentTypeId: "State Application",
      s3Key: "s3-key-123",
      uploadedBy: "user-123",
      uploadedAt: new Date("2025-01-01T00:00:00.000Z"),
      deletedBy: null,
      deletedAt: null,
      fileName: "test-document.pdf",
    });
    const expectedCall = {
      where: { id: testDocumentId },
    };

    await getDocumentById(mockTransaction, testDocumentId);
    expect(transactionMocks.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
