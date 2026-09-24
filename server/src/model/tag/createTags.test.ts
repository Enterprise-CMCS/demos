import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTags } from "./createTags";
import { prisma } from "../../prismaClient";
import { validateCreateTagsInput, insertTag } from ".";
import { createNewTagNameIfNotExists } from "../tagName";
import { Tag as PrismaTag } from "@prisma/client";

vi.mock(".", () => ({
  validateCreateTagsInput: vi.fn(),
  insertTag: vi.fn(),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../tagName", () => ({
  createNewTagNameIfNotExists: vi.fn(),
}));

describe("createTag", () => {
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(insertTag).mockResolvedValue({ tagNameId: "My New Tag!" } as PrismaTag);
  });

  it("should validate the tag create input in a transaction", async () => {
    await createTags(["New Tag Value"]);
    expect(validateCreateTagsInput).toHaveBeenCalledExactlyOnceWith(
      ["New Tag Value"],
      mockTransaction
    );
  });

  it("should insert a new tagname, demonstration type tag, and application tag in a transaction", async () => {
    await createTags(["New Tag Value"]);
    expect(createNewTagNameIfNotExists).toHaveBeenCalledExactlyOnceWith(
      "New Tag Value",
      mockTransaction
    );
    expect(insertTag).toHaveBeenNthCalledWith(1, "New Tag Value", "Application", mockTransaction);
    expect(insertTag).toHaveBeenNthCalledWith(
      2,
      "New Tag Value",
      "Demonstration Type",
      mockTransaction
    );
  });

  it("should return the created demonstration type tags with all properties", async () => {
    const mockCreatedTag: Partial<PrismaTag> = {
      tagNameId: "New Tag Value",
    };
    vi.mocked(insertTag).mockResolvedValue(mockCreatedTag as PrismaTag);

    const result = await createTags(["New Tag Value"]);

    expect(result).toEqual([mockCreatedTag]);
  });
});
