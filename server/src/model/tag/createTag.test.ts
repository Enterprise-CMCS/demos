import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTag } from "./createTag";
import { prisma } from "../../prismaClient";
import { validateCreateTagInput, insertTag } from ".";
import { createNewTagNameIfNotExists } from "../tagName";
import { Tag as PrismaTag } from "@prisma/client";

vi.mock(".", () => ({
  validateCreateTagInput: vi.fn(),
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
    await createTag("New Tag Value");
    expect(validateCreateTagInput).toHaveBeenCalledExactlyOnceWith(
      "New Tag Value",
      mockTransaction
    );
  });

  it("should insert a new tagname, demonstration type tag, and application tag in a transaction", async () => {
    await createTag("New Tag Value");
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

  it("should return the created demonstration type tag with all properties", async () => {
    const mockCreatedTag: Partial<PrismaTag> = {
      tagNameId: "New Tag Value",
    };
    vi.mocked(insertTag).mockResolvedValue(mockCreatedTag as PrismaTag);

    const result = await createTag("New Tag Value");

    expect(result).toEqual(mockCreatedTag);
  });
});
