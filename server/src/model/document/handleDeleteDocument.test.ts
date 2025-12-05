import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleDeleteDocument } from "./handleDeleteDocument.js";
import { S3Adapter } from "../../adapters/s3/S3Adapter.js";
import { Document as PrismaDocument } from "@prisma/client";

// Mock dependencies
vi.mock("./queries/deleteDocumentById.js", () => ({
  deleteDocumentById: vi.fn(),
}));

import { deleteDocumentById } from "./queries/deleteDocumentById.js";

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

  it("should call deleteDocumentById before moving S3 object", async () => {
    vi.mocked(deleteDocumentById).mockResolvedValue(mockDeletedDocument);
    const callOrder: string[] = [];

    vi.mocked(deleteDocumentById).mockImplementation(async () => {
      callOrder.push("deleteDocumentById");
      return mockDeletedDocument;
    });

    vi.mocked(mockS3Adapter.moveDocumentFromCleanToDeleted).mockImplementation(async () => {
      callOrder.push("moveDocumentFromCleanToDeleted");
    });

    await handleDeleteDocument(mockTransaction, mockS3Adapter, testDocumentId);

    expect(callOrder).toEqual(["deleteDocumentById", "moveDocumentFromCleanToDeleted"]);
  });
});
