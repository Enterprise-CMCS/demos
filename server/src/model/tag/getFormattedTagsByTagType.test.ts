import { describe, it, expect, vi } from "vitest";
import { getFormattedTagsByTagType } from "./getFormattedTagsByTagType";

// Mock imports
import { getTagsByTagType } from ".";

vi.mock(".", () => ({
  getTagsByTagType: vi.fn(),
}));

describe("getFormattedTagsByTagType", () => {
  vi.mocked(getTagsByTagType).mockResolvedValue([
    {
      tagNameId: "Tag One",
      tagTypeId: "Application",
      sourceId: "User",
      statusId: "Unapproved",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      tagNameId: "Tag Two",
      tagTypeId: "Application",
      sourceId: "System",
      statusId: "Approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      tagNameId: "Tag Three",
      tagTypeId: "Application",
      sourceId: "User",
      statusId: "Approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  it("should return objects containing the tag ids and approval status after retrieving them", async () => {
    const result = await getFormattedTagsByTagType("Application");

    expect(getTagsByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    expect(result).toEqual([
      {
        tagName: "Tag One",
        approvalStatus: "Unapproved",
      },
      { tagName: "Tag Two", approvalStatus: "Approved" },
      { tagName: "Tag Three", approvalStatus: "Approved" },
    ]);
  });
});
