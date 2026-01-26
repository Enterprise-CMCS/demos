import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewTagConfigurationIfNotExists } from "./createNewTagConfigurationIfNotExists";
import { TagConfigurationSource, TagConfigurationStatus, TagType } from "../../../types";

describe("createNewTagConfigurationIfNotExists", () => {
  const transactionMocks = {
    tagConfiguration: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    tagConfiguration: {
      upsert: transactionMocks.tagConfiguration.upsert,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: {
        tagId_tagTypeId: {
          tagId: "New Tag Value",
          tagTypeId: "Application" satisfies TagType,
        },
      },
      update: {},
      create: {
        tagId: "New Tag Value",
        tagTypeId: "Application" satisfies TagType,
        sourceId: "User" satisfies TagConfigurationSource,
        statusId: "Unreviewed" satisfies TagConfigurationStatus,
      },
    };

    await createNewTagConfigurationIfNotExists("New Tag Value", "Application", mockTransaction);
    expect(transactionMocks.tagConfiguration.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
