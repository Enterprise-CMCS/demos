import { describe, it, expect, vi } from "vitest";
import { selectUser } from "./selectUser";

// Mock imports
import { User as PrismaUser } from "@prisma/client";
import { selectUserOrThrow } from "./selectUserOrThrow";

vi.mock("./selectUser", () => ({
  selectUser: vi.fn(),
}));

describe("selectUserOrThrow", () => {
  it("should throw an error if no user is found", async () => {
    vi.mocked(selectUser).mockResolvedValue(null);
    await expect(selectUserOrThrow({ id: "nonexistent-id" })).rejects.toThrow(
      "No user found matching the provided filter"
    );
  });
  it("should return the user if one is found", async () => {
    const mockUser = {
      id: "existing-id",
    } as PrismaUser;
    vi.mocked(selectUser).mockResolvedValue(mockUser);
    const result = await selectUserOrThrow({ id: "existing-id" });
    expect(result).toEqual(mockUser);
  });
});
