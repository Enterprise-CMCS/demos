import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDocumentExists } from "./getDocumentExists.js";

describe("getDocumentExists", () => {
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

  it("should check if document exists by id in the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.document.findUnique).mockResolvedValue({
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

    await getDocumentExists(mockTransaction, testDocumentId);
    expect(transactionMocks.document.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return true when document exists", async () => {
    vi.mocked(transactionMocks.document.findUnique).mockResolvedValue({
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

    const result = await getDocumentExists(mockTransaction, testDocumentId);
    expect(result).toBe(true);
  });

  it("should return false when document does not exist", async () => {
    vi.mocked(transactionMocks.document.findUnique).mockResolvedValue(null);

    const result = await getDocumentExists(mockTransaction, testDocumentId);
    expect(result).toBe(false);
  });
});
