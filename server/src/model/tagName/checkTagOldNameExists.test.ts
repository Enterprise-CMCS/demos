import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTagOldNameExists } from "./checkTagOldNameExists";
import { selectTagName } from ".";

vi.mock(".", () => ({
  selectTagName: vi.fn(),
}));

describe("checkTagOldNameExists", () => {
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call selectTagName with the correct parameters", async () => {
    vi.mocked(selectTagName).mockResolvedValue(null);

    await checkTagOldNameExists("Old Tag Name", mockTransaction);
    expect(selectTagName).toHaveBeenCalledExactlyOnceWith("Old Tag Name", mockTransaction);
  });

  it("should return undefined when the tag name exists", async () => {
    const existingTagName = { id: "Old Tag Name" };
    vi.mocked(selectTagName).mockResolvedValue(existingTagName as any);

    const result = await checkTagOldNameExists("Old Tag Name", mockTransaction);
    expect(result).toBeUndefined();
  });

  it("should return an error message when the tag name does not exist", async () => {
    vi.mocked(selectTagName).mockResolvedValue(null);

    const result = await checkTagOldNameExists("Nonexistent Tag", mockTransaction);
    expect(result).toBe("Cannot rename tag named Nonexistent Tag as the name does not exist.");
  });
});
