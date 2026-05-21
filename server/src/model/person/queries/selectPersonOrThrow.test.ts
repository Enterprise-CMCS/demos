import { describe, it, expect, vi } from "vitest";
import { selectPerson } from "./selectPerson";

// Mock imports
import { Person as PrismaPerson } from "@prisma/client";
import { selectPersonOrThrow } from "./selectPersonOrThrow";

vi.mock("./selectPerson", () => ({
  selectPerson: vi.fn(),
}));

describe("selectPersonOrThrow", () => {
  it("should throw an error if no person is found", async () => {
    vi.mocked(selectPerson).mockResolvedValue(null);
    await expect(selectPersonOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No person found matching the provided filter"
    );
  });
  it("should return the person if one is found", async () => {
    const mockPerson = {
      id: "existing-id",
    } as PrismaPerson;
    vi.mocked(selectPerson).mockResolvedValue(mockPerson);
    const result = await selectPersonOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockPerson);
  });
});
