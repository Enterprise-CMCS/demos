import { describe, it, expect, vi, beforeEach } from "vitest";
import { Document as PrismaDocument } from "@prisma/client";
import { S3Adapter } from "../../adapters";
import { handleDeleteDocument, deleteDocumentById } from ".";

vi.mock("./queries/deleteDocumentById", () => ({
  deleteDocumentById: vi.fn(),
}));

describe("handleDeleteDocument", () => {
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

  const mockS3Adapter = {
    moveDocumentFromCleanToDeleted: vi.fn(),
  } as unknown as S3Adapter;

  const testDocumentId = "doc-123-456";
  const testApplicationId = "app-123-456";

  const mockDeletedDocument: PrismaDocument = {
    name: "Test Document",
    id: testDocumentId,
    description: "Test document description",
    s3Path: "s3/path/to/document.pdf",
    ownerUserId: "user-123",
    documentTypeId: "State Application",
    applicationId: testApplicationId,
    phaseId: "Concept",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete document by id and move it to deleted bucket", async () => {
    vi.mocked(deleteDocumentById).mockResolvedValue(mockDeletedDocument);

    await handleDeleteDocument(mockTransaction, mockS3Adapter, testDocumentId);

    expect(deleteDocumentById).toHaveBeenCalledExactlyOnceWith(mockTransaction, testDocumentId);
    expect(mockS3Adapter.moveDocumentFromCleanToDeleted).toHaveBeenCalledExactlyOnceWith(
      `${testApplicationId}/${testDocumentId}`
    );
  });

  it("should construct S3 key from applicationId and document id", async () => {
    vi.mocked(deleteDocumentById).mockResolvedValue(mockDeletedDocument);
    const expectedKey = `${testApplicationId}/${testDocumentId}`;

    await handleDeleteDocument(mockTransaction, mockS3Adapter, testDocumentId);

    expect(mockS3Adapter.moveDocumentFromCleanToDeleted).toHaveBeenCalledWith(expectedKey);
  });

  it("should return the deleted document", async () => {
    vi.mocked(deleteDocumentById).mockResolvedValue(mockDeletedDocument);

    const result = await handleDeleteDocument(mockTransaction, mockS3Adapter, testDocumentId);

    expect(result).toEqual(mockDeletedDocument);
  });
});
