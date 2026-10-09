import { describe, expect, it, vi } from "vitest";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";
import { prisma } from "../../prismaClient";

const mockDocumentId = "document-id";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("validateDocumentCanBeDeleted", () => {
  it("should throw an error if the document is part of a deliverable submission", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverableSubmissionActionId: "action1",
        }),
      },
    } as never);
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).rejects.toThrow(
      `Document with ID document-id cannot be deleted because it is part of a deliverable submission.`
    );
  });

  it("should not throw an error if the document is not part of a deliverable submission", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverableSubmissionActionId: null,
        }),
      },
    } as never);
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });

  it("should throw an error if the document's deliverable is in a finalized status", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverable: {
            statusId: "Approved",
          },
        }),
      },
    } as never);
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).rejects.toThrow(
      `Document with ID document-id cannot be updated because its deliverable is in a finalized status of Approved.`
    );
  });

  it("should not throw an error if the document's deliverable is not in a finalized status", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverable: {
            statusId: "Submitted",
          },
        }),
      },
    } as never);
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });

  it("should not throw an error when the document is not attached to a deliverable", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverable: null,
        }),
      },
    } as never);
    await expect(validateDocumentCanBeDeleted(mockDocumentId)).resolves.not.toThrow();
  });
});
