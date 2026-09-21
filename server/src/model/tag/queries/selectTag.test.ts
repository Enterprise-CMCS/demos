import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectTag } from "./selectTag";
import { TagType } from "../../../types";

describe("selectTag", () => {
  const transactionMocks = {
    tag: {
      findUnique: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      findUnique: transactionMocks.tag.findUnique,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: {
        tagNameId_tagTypeId: {
          tagNameId: "Existing Tag Value",
          tagTypeId: "Application" satisfies TagType,
        },
      },
    };

    await selectTag("Existing Tag Value", "Application", mockTransaction);
    expect(transactionMocks.tag.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return the found tag", async () => {
    const foundTag = { tagNameId: "Existing Tag Value", tagTypeId: "Application" };
    transactionMocks.tag.findUnique.mockResolvedValue(foundTag);

    const result = await selectTag("Existing Tag Value", "Application", mockTransaction);
    expect(result).toBe(foundTag);
  });

  it("should return null when the tag is not found", async () => {
    transactionMocks.tag.findUnique.mockResolvedValue(null);

    const result = await selectTag("Missing Tag Value", "Application", mockTransaction);
    expect(result).toBeNull();
  });
});
