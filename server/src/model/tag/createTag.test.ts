import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTag } from "./createTag";
import { prisma } from "../../prismaClient";
import { validateCreateTagInput, insertTag } from ".";
import { createNewTagNameIfNotExists } from "../tagName";

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
    vi.mocked(insertTag).mockResolvedValue({ tagNameId: "My New Tag!" } as any);
  });

  it("should validate the tag create input in a transaction", async () => {
    await createTag("New Tag Value");
    expect(validateCreateTagInput).toHaveBeenCalledExactlyOnceWith(
      "New Tag Value",
      mockTransaction
    );
  });

  it("should upsert a new tag name in a transaction", async () => {
    await createTag("New Tag Value");
    expect(createNewTagNameIfNotExists).toHaveBeenCalledExactlyOnceWith(
      "New Tag Value",
      mockTransaction
    );
  });

  it("should insert a new application tag in a transaction", async () => {
    await createTag("New Tag Value");
    expect(insertTag).toHaveBeenNthCalledWith(
      1,
      "New Tag Value",
      "Demonstration Type",
      mockTransaction
    );
  });

  it("should insert a new demonstration type tag in a transaction", async () => {
    await createTag("New Tag Value");
    expect(insertTag).toHaveBeenNthCalledWith(2, "New Tag Value", "Application", mockTransaction);
  });

  it("should return the created demonstration type tag with all properties", async () => {
    const mockCreatedTag = {
      id: "tag-456",
      tagNameId: "New Tag Value",
      tagTypeId: "Demonstration Type",
      sourceId: "User",
      statusId: "Unapproved",
      createdAt: new Date("2026-09-21"),
      updatedAt: new Date("2026-09-21"),
    };
    vi.mocked(insertTag).mockResolvedValue(mockCreatedTag as any);

    const result = await createTag("New Tag Value");

    expect(result).toEqual(mockCreatedTag);
    expect(result.tagNameId).toBe("New Tag Value");
    expect(result.tagTypeId).toBe("Demonstration Type");
    expect(result.statusId).toBe("Unapproved");
  });
});
