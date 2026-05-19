import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectAmendment } from "./selectAmendment";

// Mock imports
import { Amendment as PrismaAmendment } from "@prisma/client";
import { selectAmendmentOrThrow } from "./selectAmendmentOrThrow";

vi.mock("./selectAmendment", () => ({
  selectAmendment: vi.fn(),
}));

describe("selectAmendmentOrThrow", () => {
  it("should throw an error if no amendment is found", async () => {
    vi.mocked(selectAmendment).mockResolvedValue(null);
    await expect(selectAmendmentOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No amendment found matching the provided filter"
    );
  });
  it("should return the amendment if one is found", async () => {
    const mockAmendment = {
      id: "existing-id",
      statusId: "Upcoming",
    } as PrismaAmendment;
    vi.mocked(selectAmendment).mockResolvedValue(mockAmendment);
    const result = await selectAmendmentOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockAmendment);
  });
});
