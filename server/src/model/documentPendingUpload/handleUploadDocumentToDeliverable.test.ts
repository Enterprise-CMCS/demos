import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleUploadDocumentToDeliverable } from "./handleUploadDocumentToDeliverable";
import { UploadDocumentToDeliverableInput } from "./documentPendingUploadSchema";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { selectDeliverableOrThrow } from "../deliverable";

const testInput: UploadDocumentToDeliverableInput = {
  applicationId: "app-123",
  deliverableId: "deliverable-123",
  description: "Test document",
  documentType: "Close Out Report",
  name: "test-document.pdf",
};
const testOwnerUserId = "user-123";

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

vi.mock("../deliverable", () => ({
  selectDeliverableOrThrow: vi.fn(),
}));

const mockS3Adapter = {
  uploadDocument: vi.fn(),
};

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(() => mockS3Adapter),
}));

describe("handleUploadDocumentToDeliverable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectDeliverableOrThrow).mockResolvedValue({
      deliverableTypeId: "type-123",
    } as any);
  });

  it("checks optional fields for null values", async () => {
    await handleUploadDocumentToDeliverable(testInput, testOwnerUserId, false);
    expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(["description"], testInput);
  });

  it("fetches the appropriate deliverable", async () => {
    await handleUploadDocumentToDeliverable(testInput, testOwnerUserId, false);
    expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith({
      id: testInput.deliverableId,
    });
  });

  it("calls uploadDocument with appropriate cms-file configuration", async () => {
    await handleUploadDocumentToDeliverable(testInput, testOwnerUserId, true);
    expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith({
      name: testInput.name,
      description: testInput.description,
      applicationId: testInput.applicationId,
      ownerUserId: testOwnerUserId,
      documentTypeId: testInput.documentType,
      deliverableId: testInput.deliverableId,
      deliverableIsCmsAttachedFile: true,
      deliverableTypeId: "type-123",
    });
  });

  it("calls uploadDocument with appropriate state-file configuration", async () => {
    await handleUploadDocumentToDeliverable(testInput, testOwnerUserId, false);
    expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith({
      name: testInput.name,
      description: testInput.description,
      applicationId: testInput.applicationId,
      ownerUserId: testOwnerUserId,
      documentTypeId: testInput.documentType,
      deliverableId: testInput.deliverableId,
      deliverableIsCmsAttachedFile: false,
      deliverableTypeId: "type-123",
    });
  });
});
