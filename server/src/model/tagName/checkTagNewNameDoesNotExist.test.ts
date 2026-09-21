import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTagNewNameDoesNotExist } from "./checkTagNewNameDoesNotExist";
import { selectTagName } from "./queries/selectTagName";

vi.mock("./queries/selectTagName", () => ({
  selectTagName: vi.fn(),
}));

describe("checkTagNewNameDoesNotExist", () => {
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call selectTagName with the correct parameters", async () => {
    vi.mocked(selectTagName).mockResolvedValue(null);

    await checkTagNewNameDoesNotExist("New Tag Name", mockTransaction);
    expect(selectTagName).toHaveBeenCalledExactlyOnceWith("New Tag Name", mockTransaction);
  });

  it("should return undefined when the tag name does not exist", async () => {
    vi.mocked(selectTagName).mockResolvedValue(null);

    const result = await checkTagNewNameDoesNotExist("New Tag Name", mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return an error message when the tag name already exists", async () => {
    const existingTagName = { id: "New Tag Name" };
    vi.mocked(selectTagName).mockResolvedValue(existingTagName as any);

    const result = await checkTagNewNameDoesNotExist("New Tag Name", mockTransaction);
    expect(result).toBe("Cannot rename tag to name New Tag Name as the name already exists.");
  });
});
