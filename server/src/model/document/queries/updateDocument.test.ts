import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateDocument } from "../";
import { UpdateDocumentInput } from "../../../types";

describe("updateDocument", () => {
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

    await updateDocument(mockTransaction, testDocumentId, testInput);
    expect(transactionMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
