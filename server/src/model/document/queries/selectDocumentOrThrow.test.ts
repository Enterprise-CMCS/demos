import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDocument } from "./selectDocument";

// Mock imports
import { Document as PrismaDocument } from "@prisma/client";
import { selectDocumentOrThrow } from "./selectDocumentOrThrow";

vi.mock("./selectDocument", () => ({
  selectDocument: vi.fn(),
}));

describe("selectDocumentOrThrow", () => {
  it("should throw an error if no document is found", async () => {
    vi.mocked(selectDocument).mockResolvedValue(null);
    await expect(selectDocumentOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No document found matching the provided filter"
    );
  });
  it("should return the document if one is found", async () => {
    const mockDocument = {
      id: "existing-id",
    } as PrismaDocument;
    vi.mocked(selectDocument).mockResolvedValue(mockDocument);
    const result = await selectDocumentOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockDocument);
  });
});
