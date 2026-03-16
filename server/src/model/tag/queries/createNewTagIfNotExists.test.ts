import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewTagIfNotExists } from "./createNewTagIfNotExists";
import { TagSource, TagStatus, TagType } from "../../../types";

describe("createNewTagIfNotExists", () => {
  const transactionMocks = {
    tag: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      upsert: transactionMocks.tag.upsert,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: {
        tagNameId_tagTypeId: {
          tagNameId: "New Tag Value",
          tagTypeId: "Application" satisfies TagType,
        },
      },
      update: {},
      create: {
        tagNameId: "New Tag Value",
        tagTypeId: "Application" satisfies TagType,
        sourceId: "User" satisfies TagSource,
        statusId: "Unapproved" satisfies TagStatus,
      },
    };

    await createNewTagIfNotExists("New Tag Value", "Application", mockTransaction);
    expect(transactionMocks.tag.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
