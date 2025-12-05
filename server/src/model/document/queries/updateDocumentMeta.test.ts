import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateDocumentMeta } from "./updateDocumentMeta.js";
import { UpdateDocumentInput } from "../documentSchema.js";

describe("updateDocumentMeta", () => {
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
  const testDocumentId = "doc-123-456";
  const testInput: UpdateDocumentInput = {
    name: "Updated Document Name",
    description: "Updated description",
    documentType: "State Application",
    applicationId: "app-123-456",
    phaseName: "Concept",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should update document metadata in the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.document.update).mockResolvedValue({
      id: testDocumentId,
      applicationId: testInput.applicationId,
      documentTypeId: testInput.documentType,
      s3Key: "s3-key-123",
      uploadedBy: "user-123",
      uploadedAt: new Date("2025-01-01T00:00:00.000Z"),
      deletedBy: null,
      deletedAt: null,
      fileName: testInput.name,
    });
    const expectedCall = {
      where: { id: testDocumentId },
      data: {
        name: testInput.name,
        description: testInput.description,
        documentTypeId: testInput.documentType,
        applicationId: testInput.applicationId,
        phaseId: testInput.phaseName,
      },
    };

    await updateDocumentMeta(mockTransaction, testDocumentId, testInput);
    expect(transactionMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
