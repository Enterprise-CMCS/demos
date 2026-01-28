import { describe, it, expect, vi } from "vitest";
import { getTagListByTagType } from "./getTagListByTagType";

// Mock imports
import { getTagConfigurationByTagType } from ".";

vi.mock(".", () => ({
  getTagConfigurationByTagType: vi.fn(),
}));

describe("getTagListByTagType", () => {
  vi.mocked(getTagConfigurationByTagType).mockResolvedValue([
    {
      tagId: "Tag One",
      tagTypeId: "Application",
      sourceId: "User",
      statusId: "Unverified",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      tagId: "Tag Two",
      tagTypeId: "Application",
      sourceId: "System",
      statusId: "Approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      tagId: "Tag Three",
      tagTypeId: "Application",
      sourceId: "User",
      statusId: "Approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  it("should return only the tag IDs after retrieving them", async () => {
    const result = await getTagListByTagType("Application");

    expect(getTagConfigurationByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    expect(result).toEqual(["Tag One", "Tag Two", "Tag Three"]);
  });
});
