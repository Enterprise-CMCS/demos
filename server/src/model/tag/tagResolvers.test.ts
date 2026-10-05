// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Tag as PrismaTag } from "@prisma/client";

// Functions under test
import { tagResolvers } from "./tagResolvers";

// Mock imports
vi.mock(".", () => ({
  getDemonstrationTypeSummaryCounts: vi.fn(),
  getFormattedTagsByTagType: vi.fn(),
  createTags: vi.fn(),
  approveTags: vi.fn(),
  deleteTags: vi.fn(),
}));

import {
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
  createTags,
  approveTags,
  deleteTags,
} from ".";
import { __DEMOS_VERSION__ } from "../../flags";

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
    it("should call createTags with the correct tagName", async () => {
      const mockCreatedTags: Partial<PrismaTag>[] = [
        {
          tagNameId: "My New Tag!",
          tagTypeId: "Demonstration Type",
          sourceId: "User",
          statusId: "Unapproved",
          createdAt: new Date("2026-09-21"),
          updatedAt: new Date("2026-09-21"),
        },
      ];
      vi.mocked(createTags).mockResolvedValue(mockCreatedTags as PrismaTag[]);
      const result = await tagResolvers.Mutation.createTags(null, { tagNames: ["My New Tag!"] });
      expect(createTags).toHaveBeenCalledExactlyOnceWith(["My New Tag!"]);

      expect(result[0].tagName).toBe("My New Tag!");
      expect(result[0].approvalStatus).toBe("Unapproved");
    });
  });

  describe("Mutation.approveTags", () => {
    it("should call approveTags with the correct arguments", async () => {
      await tagResolvers.Mutation.approveTags(null, {
        tagNames: ["my unapproved tag!", "my other tag"],
      });

      expect(approveTags).toHaveBeenCalledExactlyOnceWith(
        ["my unapproved tag!", "my other tag"],
        __DEMOS_VERSION__
      );
    });
  });

  describe("Mutation.deleteTags", () => {
    it("should call deleteTags with the correct arguments", async () => {
      await tagResolvers.Mutation.deleteTags(null, {
        tagNames: ["my unapproved tag!", "my other tag"],
      });

      expect(deleteTags).toHaveBeenCalledExactlyOnceWith(
        ["my unapproved tag!", "my other tag"],
        __DEMOS_VERSION__
      );
    });
  });
});
