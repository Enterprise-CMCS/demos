import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDeliverable } from "./selectDeliverable";

// Mock imports
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { selectDeliverableOrThrow } from "./selectDeliverableOrThrow";

vi.mock("./selectDeliverable", () => ({
  selectDeliverable: vi.fn(),
}));

describe("selectDeliverableOrThrow", () => {
  it("should throw an error if no deliverable is found", async () => {
    vi.mocked(selectDeliverable).mockResolvedValue(null);
    await expect(selectDeliverableOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No deliverable found matching the provided filter"
    );
  });
  it("should return the deliverable if one is found", async () => {
    const mockDeliverable = {
      id: "existing-id",
      statusId: "Upcoming",
    } as PrismaDeliverable;
    vi.mocked(selectDeliverable).mockResolvedValue(mockDeliverable);
    const result = await selectDeliverableOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockDeliverable);
  });
});
