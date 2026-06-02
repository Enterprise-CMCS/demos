import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateDocument } from "../";
import { UpdateDocumentInput } from "../../../types";
import { validateDocumentCanBeUpdated } from "../validateDocumentCanBeUpdated";
import type { ContextUser } from "../../../auth";

vi.mock("../validateDocumentCanBeUpdated", () => ({
  validateDocumentCanBeUpdated: vi.fn(),
}));

describe("updateDocument", () => {
  const transactionMocks = {
    document: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findUnique: transactionMocks.document.findUnique,
      update: transactionMocks.document.update,
    },
  } as any;
  const testDocumentId = "doc-123-456";
  const testInput: UpdateDocumentInput = {
    name: "Updated Document Name",
    description: "Updated description",
    documentType: "State Application",
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
      },
    };

    await updateDocument(mockTransaction, testDocumentId, testInput);
    expect(transactionMocks.document.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should validate state-user document updates before updating", async () => {
    const stateUser: ContextUser = {
      id: "state-user-1",
      cognitoSubject: "state-subject",
      personTypeId: "demos-state-user",
      permissions: [],
    };
    const documentToUpdate = {
      id: testDocumentId,
      ownerUserId: stateUser.id,
      deliverableIsCmsAttachedFile: false,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Upcoming" },
    };
    transactionMocks.document.findUnique.mockResolvedValue(documentToUpdate);

    await updateDocument(mockTransaction, testDocumentId, testInput, stateUser);

    expect(validateDocumentCanBeUpdated).toHaveBeenCalledExactlyOnceWith(
      documentToUpdate,
      stateUser
    );
    expect(transactionMocks.document.update).toHaveBeenCalledOnce();
  });

  it("should not run state-user validation for CMS users", async () => {
    const cmsUser: ContextUser = {
      id: "cms-user-1",
      cognitoSubject: "cms-subject",
      personTypeId: "demos-cms-user",
      permissions: [],
    };

    await updateDocument(mockTransaction, testDocumentId, testInput, cmsUser);

    expect(transactionMocks.document.findUnique).not.toHaveBeenCalled();
    expect(validateDocumentCanBeUpdated).not.toHaveBeenCalled();
    expect(transactionMocks.document.update).toHaveBeenCalledOnce();
  });
});
