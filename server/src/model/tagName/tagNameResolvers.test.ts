import { describe, it, expect, vi, beforeEach } from "vitest";
import { tagNameResolvers } from "./tagNameResolvers";
import { renameTag } from "./renameTag";

vi.mock("./renameTag", () => ({
  renameTag: vi.fn(),
}));

describe("tagNameResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Mutation.renameTag", () => {
    it("should call renameTag with the correct parameters", async () => {
      vi.mocked(renameTag).mockResolvedValue({ id: "New Tag Name" } as any);

      await tagNameResolvers.Mutation.renameTag(null, { oldName: "Old Name", newName: "New Name" });
      expect(renameTag).toHaveBeenCalledExactlyOnceWith("Old Name", "New Name");
    });

    it("should return the new tag name id", async () => {
      const mockUpdatedTag = { id: "Updated Tag Name" };
      vi.mocked(renameTag).mockResolvedValue(mockUpdatedTag as any);

      const result = await tagNameResolvers.Mutation.renameTag(null, {
        oldName: "Old Name",
        newName: "New Name",
      });

      expect(result).toBe("Updated Tag Name");
    });
  });
});
