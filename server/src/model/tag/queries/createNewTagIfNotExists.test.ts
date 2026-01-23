import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewTagIfNotExists } from "./createNewTagIfNotExists";

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
        id: "New Tag Value",
      },
      update: {},
      create: {
        id: "New Tag Value",
      },
    };

    await createNewTagIfNotExists("New Tag Value", mockTransaction);
    expect(transactionMocks.tag.upsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
