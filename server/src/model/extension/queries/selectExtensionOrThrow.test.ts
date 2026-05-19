import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectExtension } from "./selectExtension";

// Mock imports
import { Extension as PrismaExtension } from "@prisma/client";
import { selectExtensionOrThrow } from "./selectExtensionOrThrow";

vi.mock("./selectExtension", () => ({
  selectExtension: vi.fn(),
}));

describe("selectExtensionOrThrow", () => {
  it("should throw an error if no extension is found", async () => {
    vi.mocked(selectExtension).mockResolvedValue(null);
    await expect(selectExtensionOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No extension found matching the provided filter"
    );
  });
  it("should return the extension if one is found", async () => {
    const mockExtension = {
      id: "existing-id",
      statusId: "Upcoming",
    } as PrismaExtension;
    vi.mocked(selectExtension).mockResolvedValue(mockExtension);
    const result = await selectExtensionOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockExtension);
  });
});
