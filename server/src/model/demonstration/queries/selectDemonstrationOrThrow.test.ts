import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDemonstration } from "./selectDemonstration";

// Mock imports
import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { selectDemonstrationOrThrow } from "./selectDemonstrationOrThrow";

vi.mock("./selectDemonstration", () => ({
  selectDemonstration: vi.fn(),
}));

describe("selectDemonstrationOrThrow", () => {
  it("should throw an error if no demonstration is found", async () => {
    vi.mocked(selectDemonstration).mockResolvedValue(null);
    await expect(selectDemonstrationOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No demonstration found matching the provided filter"
    );
  });
  it("should return the demonstration if one is found", async () => {
    const mockDemonstration = {
      id: "existing-id",
      statusId: "Upcoming",
    } as PrismaDemonstration;
    vi.mocked(selectDemonstration).mockResolvedValue(mockDemonstration);
    const result = await selectDemonstrationOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockDemonstration);
  });
});
