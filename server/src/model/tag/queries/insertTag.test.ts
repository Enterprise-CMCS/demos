import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertTag } from "./insertTag";
import { TagSource, TagStatus, TagType } from "../../../types";

describe("insertTag", () => {
  const transactionMocks = {
    tag: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      create: transactionMocks.tag.create,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      data: {
        tagNameId: "New Tag Value",
        tagTypeId: "Application" satisfies TagType,
        sourceId: "User" satisfies TagSource,
        statusId: "Unapproved" satisfies TagStatus,
      },
    };

    await insertTag("New Tag Value", "Application", mockTransaction);
    expect(transactionMocks.tag.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return the created tag", async () => {
    const createdTag = { tagNameId: "New Tag Value", tagTypeId: "Application" };
    transactionMocks.tag.create.mockResolvedValue(createdTag);

    const result = await insertTag("New Tag Value", "Application", mockTransaction);
    expect(result).toBe(createdTag);
  });
});
