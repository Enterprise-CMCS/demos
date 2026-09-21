import { beforeEach, describe, expect, it, vi } from "vitest";
import { renameTag } from "./renameTag";
import { prisma } from "../../prismaClient";
import { validateRenameTagInput } from "./validateRenameTagInput";
import { updateTagName } from "./queries/updateTagName";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./validateRenameTagInput", () => ({
  validateRenameTagInput: vi.fn(),
}));

vi.mock("./queries/updateTagName", () => ({
  updateTagName: vi.fn(),
}));

describe("renameTag", () => {
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(updateTagName).mockResolvedValue({ id: "New Tag Name" } as any);
  });

  it("should validate the rename input in a transaction", async () => {
    await renameTag("Old Name", "New Name");
    expect(validateRenameTagInput).toHaveBeenCalledExactlyOnceWith(
      "Old Name",
      "New Name",
      mockTransaction
    );
  });

  it("should update the tag name in a transaction", async () => {
    await renameTag("Old Name", "New Name");
    expect(updateTagName).toHaveBeenCalledExactlyOnceWith(
      { id: "Old Name" },
      { id: "New Name" },
      mockTransaction
    );
  });

  it("should return the updated tag name with correct properties", async () => {
    const mockUpdatedTag = { id: "New Tag Name" };
    vi.mocked(updateTagName).mockResolvedValue(mockUpdatedTag as any);

    const result = await renameTag("Old Name", "New Name");

    expect(result).toEqual(mockUpdatedTag);
    expect(result.id).toBe("New Tag Name");
  });
});
