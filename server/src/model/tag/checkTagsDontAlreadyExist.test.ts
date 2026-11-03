import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTagsDontAlreadyExist } from "./checkTagsDontAlreadyExist";
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

    await checkTagsDontAlreadyExist(["My Tag"], mockTransaction);
    expect(selectTags).toHaveBeenCalledExactlyOnceWith(
      { tagNameId: { in: ["My Tag"] } },
      mockTransaction
    );
  });

  it("should return undefined when the tag does not exist", async () => {
    vi.mocked(selectTags).mockResolvedValue([]);

    const result = await checkTagsDontAlreadyExist(["My Tag"], mockTransaction);
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

    const result = await checkTagsDontAlreadyExist(["My Tag"], mockTransaction);
    expect(result).toBe("Cannot create new tags as one or more tags already exist: My Tag.");
  });

  it("should return an error message when multiple tags already exist", async () => {
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
      {
        id: "tag-2",
        tagNameId: "Another Tag",
        tagTypeId: "Application",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(selectTags).mockResolvedValue(existingTags as any);

    const result = await checkTagsDontAlreadyExist(["My Tag", "Another Tag"], mockTransaction);
    expect(result).toBe(
      "Cannot create new tags as one or more tags already exist: My Tag, Another Tag."
    );
  });

  it("should return an error message when some tags exist and some do not", async () => {
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

    const result = await checkTagsDontAlreadyExist(["My Tag", "Nonexistent Tag"], mockTransaction);
    expect(result).toBe("Cannot create new tags as one or more tags already exist: My Tag.");
  });
});
