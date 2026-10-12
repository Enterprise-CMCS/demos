import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";
import { prisma } from "../../prismaClient";

const mockDocumentId = "document-id";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("validateDocumentCanBeDeleted", () => {
  const regularMocks = {
    document: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findUniqueOrThrow: regularMocks.document.findUniqueOrThrow,
    },
  };
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
    regularMocks.document.findUniqueOrThrow.mockResolvedValue({
      id: mockDocumentId,
      deliverable: null,
      deliverableSubmissionActionId: null,
    });
  });

  it("should get document from the database directly if no transaction is given", async () => {
    await validateDocumentCanBeDeleted(mockDocumentId);
    expect(regularMocks.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: mockDocumentId },
      include: { deliverable: true },
    });
    expect(transactionMocks.document.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get document via a transaction if one is given", async () => {
    transactionMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverable: null,
      deliverableSubmissionActionId: null,
    });
    await validateDocumentCanBeDeleted(mockDocumentId, mockTransaction);
    expect(regularMocks.document.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
      where: { id: mockDocumentId },
      include: { deliverable: true },
    });
  });

  it("should throw an error if the document is part of a deliverable submission", async () => {
    regularMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverableSubmissionActionId: "action1",
    });
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).rejects.toThrow(
      `Document with ID document-id cannot be deleted because it is part of a deliverable submission.`
    );
  });

  it("should not throw an error if the document is not part of a deliverable submission", async () => {
    regularMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverableSubmissionActionId: null,
    });
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });

  it("should throw an error if the document's deliverable is in a finalized status", async () => {
    regularMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverable: {
        statusId: "Approved",
      },
    });
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).rejects.toThrow(
      `Document with ID document-id cannot be updated because its deliverable is in a finalized status of Approved.`
    );
  });

  it("should not throw an error if the document's deliverable is not in a finalized status", async () => {
    regularMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverable: {
        statusId: "Submitted",
      },
    });
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });

  it("should not throw an error when the document is not attached to a deliverable", async () => {
    regularMocks.document.findUniqueOrThrow.mockResolvedValueOnce({
      id: mockDocumentId,
      deliverable: null,
    });
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });
});
