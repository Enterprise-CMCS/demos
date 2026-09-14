import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock imports
import { getDemonstrationTypeSummaryCounts, getFormattedTagsByTagType, createTag } from ".";
import { tagResolvers } from "./tagResolvers";

vi.mock(".", () => ({
  getDemonstrationTypeSummaryCounts: vi.fn(),
  getFormattedTagsByTagType: vi.fn(),
  createTag: vi.fn(),
}));

describe("tagResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Tag.demonstrationTypeOptions", () => {
    it("should defer to getFormattedTagsByTagType with correct params", async () => {
      await tagResolvers.Query.demonstrationTypeOptions();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Demonstration Type");
    });
  });

  describe("Tag.applicationTagOptions", () => {
    it("should defer to getFormattedTagsByTagType with correct params", async () => {
      await tagResolvers.Query.applicationTagOptions();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    });
  });

  describe("Tag.demonstrationTypeUsageSummary", () => {
    it("should defer to getDemonstrationTypeSummaryCounts with correct params", async () => {
      await tagResolvers.Query.demonstrationTypeUsageSummary();
      expect(getDemonstrationTypeSummaryCounts).toHaveBeenCalledExactlyOnceWith();
    });
  });

  describe("Mutation.createTag", () => {
    it("should call createTag with the correct tagName", async () => {
      await tagResolvers.Mutation.createTag(null, { tagName: "My New Tag!" });
      expect(createTag).toHaveBeenCalledExactlyOnceWith("My New Tag!");
    });
  });
});
