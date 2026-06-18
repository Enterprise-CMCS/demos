import { describe, expect, it, vi } from "vitest";
import { validateDocumentCanBeUpdated } from "./validateDocumentCanBeUpdated";
import { prisma } from "../../prismaClient";

const mockDocumentId = "doc1";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("validateDocumentCanBeUpdated", () => {
  it("should throw an error if the document is part of a finalized deliverable", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverable: {
            statusId: "Accepted",
          },
        }),
      },
    } as never);

    await expect(validateDocumentCanBeUpdated(mockDocumentId)).rejects.toThrow(
      `Document with ID doc1 cannot be updated because its deliverable is in a finalized status of Accepted.`
    );
  });

  it("should not throw an error if the document is not part of a finalized deliverable", async () => {
    vi.mocked(prisma).mockReturnValue({
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: mockDocumentId,
          deliverable: {
            statusId: "Upcoming",
          },
        }),
      },
    } as never);

    await expect(validateDocumentCanBeUpdated(mockDocumentId)).resolves.toBeUndefined();
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

    await expect(validateDocumentCanBeUpdated(mockDocumentId)).resolves.toBeUndefined();
  });
});
