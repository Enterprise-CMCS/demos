import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTagDoesntAlreadyExist } from "./checkTagDoesntAlreadyExist";
import { selectTag } from "./queries/selectTag";
import { Tag as PrismaTag } from "@prisma/client";

vi.mock("./queries/selectTag", () => ({
  selectTag: vi.fn(),
}));

describe("checkTagDoesntAlreadyExist", () => {
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call selectTag with the correct parameters", async () => {
    vi.mocked(selectTag).mockResolvedValue(null);

    await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(selectTag).toHaveBeenCalledExactlyOnceWith(
      "My Tag",
      "Demonstration Type",
      mockTransaction
    );
  });

  it("should return undefined when the tag does not exist", async () => {
    vi.mocked(selectTag).mockResolvedValue(null);

    const result = await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return an error message when the tag already exists", async () => {
    const existingTag: Partial<PrismaTag> = {
      tagNameId: "My Tag",
    };
    vi.mocked(selectTag).mockResolvedValue(existingTag as PrismaTag);

    const result = await checkTagDoesntAlreadyExist("My Tag", mockTransaction);
    expect(result).toBe("Cannot create new tag with name My Tag as it already exists.");
  });
});
