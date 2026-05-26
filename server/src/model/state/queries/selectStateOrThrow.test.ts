import { describe, it, expect, vi } from "vitest";
import { selectState } from "./selectState";

// Mock imports
import { State as PrismaState } from "@prisma/client";
import { selectStateOrThrow } from "./selectStateOrThrow";

vi.mock("./selectState", () => ({
  selectState: vi.fn(),
}));

describe("selectStateOrThrow", () => {
  it("should throw an error if no state is found", async () => {
    vi.mocked(selectState).mockResolvedValue(null);
    await expect(selectStateOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No state found matching the provided filter"
    );
  });
  it("should return the state if one is found", async () => {
    const mockState = {
      id: "existing-id",
    } as PrismaState;
    vi.mocked(selectState).mockResolvedValue(mockState);
    const result = await selectStateOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockState);
  });
});
