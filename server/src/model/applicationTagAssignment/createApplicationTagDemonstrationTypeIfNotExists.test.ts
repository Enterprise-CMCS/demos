import { describe, it, expect, vi } from "vitest";
import { createApplicationTagsDemonstrationTypesIfNotExists } from ".";

// Mock imports
import { createNewTagIfNotExists } from "../tag";
import { createNewTagConfigurationIfNotExists } from "../tagConfiguration";

vi.mock("../tag", () => ({
  createNewTagIfNotExists: vi.fn(),
}));

vi.mock("../tagConfiguration", () => ({
  createNewTagConfigurationIfNotExists: vi.fn(),
}));

describe("createApplicationTagDemonstrationTypeIfNotExists", async () => {
  it("should call the tag creation queries for the new tags", async () => {
    const mockTransaction = {} as any;
    const newTags = ["New Tag Name", "Another New Tag"];

    await createApplicationTagsDemonstrationTypesIfNotExists(newTags, mockTransaction);

    expect(vi.mocked(createNewTagIfNotExists).mock.calls).toStrictEqual([
      [newTags[0], mockTransaction],
      [newTags[1], mockTransaction],
    ]);
    expect(vi.mocked(createNewTagConfigurationIfNotExists).mock.calls).toStrictEqual([
      [newTags[0], "Application", mockTransaction],
      [newTags[0], "Demonstration Type", mockTransaction],
      [newTags[1], "Application", mockTransaction],
      [newTags[1], "Demonstration Type", mockTransaction],
    ]);
  });
});
