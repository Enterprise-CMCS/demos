import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTagDoesntAlreadyExist } from "./checkTagDoesntAlreadyExist";
import { selectTags } from ".";

vi.mock(".", () => ({
  selectTags: vi.fn(),
}));

describe("checkTagDoesntAlreadyExist", () => {
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call selectTags with the correct parameters", async () => {
    vi.mocked(selectTags).mockResolvedValue([]);

    await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(selectTags).toHaveBeenCalledExactlyOnceWith({ tagNameId: "My Tag" }, mockTransaction);
  });

  it("should return undefined when the tag does not exist", async () => {
    vi.mocked(selectTags).mockResolvedValue([]);

    const result = await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return an error message when the tag already exists", async () => {
    const existingTags = [
      {
        id: "tag-1",
        tagNameId: "My Tag",
        tagTypeId: "Application",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(selectTags).mockResolvedValue(existingTags as any);

    const result = await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(result).toBe("Cannot create new tag with name My Tag as it already exists.");
  });
});
