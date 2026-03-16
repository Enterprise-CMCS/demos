import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewTagNameIfNotExists } from "./createNewTagNameIfNotExists";

describe("createNewTagIfNotExists", () => {
  const transactionMocks = {
    tagName: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    tagName: {
      upsert: transactionMocks.tagName.upsert,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: {
        id: "New Tag Value",
      },
      update: {},
      create: {
        id: "New Tag Value",
      },
    };

    await createNewTagNameIfNotExists("New Tag Value", mockTransaction);
    expect(transactionMocks.tagName.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
