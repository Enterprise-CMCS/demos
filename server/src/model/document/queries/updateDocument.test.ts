import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateDocument } from "./updateDocument";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("updateDocument", () => {
  const mockTransaction = {
    document: {
      update: vi.fn(),
    },
  } as any;

  const testWhere = {
    id: "doc-123-456",
  };
  const testData = {
    name: "Updated Document Name",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update document via a transaction", async () => {
    vi.mocked(mockTransaction.document.update).mockResolvedValue({
      id: "doc-123-456",
      name: "Updated Document Name",
    });
    const updatedDocument = await updateDocument(testWhere, testData, mockTransaction);
    expect(mockTransaction.document.update).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
      data: testData,
    });
    expect(updatedDocument).toEqual({
      id: "doc-123-456",
      name: "Updated Document Name",
    });
  });

  it("errors if document row cannot be found", async () => {
    mockTransaction.document.update.mockRejectedValue("Prisma error");
    await expect(updateDocument(testWhere, testData, mockTransaction)).rejects.toThrow(
      "Prisma error"
    );
  });
});
