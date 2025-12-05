import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDocumentPendingUpload } from "./createDocumentPendingUpload.js";
import { UploadDocumentInput } from "../../document/documentSchema.js";

describe("createDocumentPendingUpload", () => {
  const transactionMocks = {
    documentPendingUpload: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    documentPendingUpload: {
      create: transactionMocks.documentPendingUpload.create,
    },
  } as any;

  const testUserId = "user-123-456";
  const testInput: UploadDocumentInput = {
    name: "test-document.pdf",
    description: "Test document description",
    documentType: "State Application",
    applicationId: "app-123-456",
    phaseName: "Concept",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create document pending upload with all fields", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.documentPendingUpload.create).mockResolvedValue({
      id: "pending-doc-123",
      name: "test-document.pdf",
      description: "Test document description",
      ownerUserId: testUserId,
      documentTypeId: "State Application",
      applicationId: "app-123-456",
      phaseId: "Concept",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    const expectedCall = {
      data: {
        name: "test-document.pdf",
        description: "Test document description",
        ownerUserId: testUserId,
        documentTypeId: "State Application",
        applicationId: "app-123-456",
        phaseId: "Concept",
      },
    };

    await createDocumentPendingUpload(mockTransaction, testInput, testUserId);
    expect(transactionMocks.documentPendingUpload.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should default description to empty string when undefined", async () => {
    const inputWithoutDescription: UploadDocumentInput = {
      name: "test-document.pdf",
      description: undefined,
      documentType: "State Application",
      applicationId: "app-123-456",
      phaseName: "Concept",
    };

    vi.mocked(transactionMocks.documentPendingUpload.create).mockResolvedValue({
      id: "pending-doc-123",
      name: "test-document.pdf",
      description: "",
      ownerUserId: testUserId,
      documentTypeId: "State Application",
      applicationId: "app-123-456",
      phaseId: "Concept",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    const expectedCall = {
      data: {
        name: "test-document.pdf",
        description: "",
        ownerUserId: testUserId,
        documentTypeId: "State Application",
        applicationId: "app-123-456",
        phaseId: "Concept",
      },
    };

    await createDocumentPendingUpload(mockTransaction, inputWithoutDescription, testUserId);
    expect(transactionMocks.documentPendingUpload.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should map input fields to database fields correctly", async () => {
    vi.mocked(transactionMocks.documentPendingUpload.create).mockResolvedValue({
      id: "pending-doc-123",
      name: testInput.name,
      description: testInput.description,
      ownerUserId: testUserId,
      documentTypeId: testInput.documentType,
      applicationId: testInput.applicationId,
      phaseId: testInput.phaseName,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    await createDocumentPendingUpload(mockTransaction, testInput, testUserId);

    const createCall = vi.mocked(transactionMocks.documentPendingUpload.create).mock.calls[0][0];
    expect(createCall.data.name).toBe(testInput.name);
    expect(createCall.data.description).toBe(testInput.description);
    expect(createCall.data.documentTypeId).toBe(testInput.documentType);
    expect(createCall.data.phaseId).toBe(testInput.phaseName);
    expect(createCall.data.applicationId).toBe(testInput.applicationId);
    expect(createCall.data.ownerUserId).toBe(testUserId);
  });

  it("should return the created document pending upload", async () => {
    const mockCreatedDocument = {
      id: "pending-doc-123",
      name: "test-document.pdf",
      description: "Test document description",
      ownerUserId: testUserId,
      documentTypeId: "State Application",
      applicationId: "app-123-456",
      phaseId: "Concept",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    vi.mocked(transactionMocks.documentPendingUpload.create).mockResolvedValue(mockCreatedDocument);

    const result = await createDocumentPendingUpload(mockTransaction, testInput, testUserId);

    expect(result).toEqual(mockCreatedDocument);
  });
});
