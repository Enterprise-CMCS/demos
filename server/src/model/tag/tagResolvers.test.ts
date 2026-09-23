// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EDITABLE_TAG_TYPES } from "./tagResolvers";

// Types
import type { Tag as PrismaTag } from "@prisma/client";

// Functions under test
import { tagResolvers } from "./tagResolvers";

// Mock imports
vi.mock(".", () => ({
  getDemonstrationTypeSummaryCounts: vi.fn(),
  getFormattedTagsByTagType: vi.fn(),
  createTag: vi.fn(),
  selectTags: vi.fn(),
  updateTags: vi.fn(),
}));

// Thrown by the mocked throwCustomGQLError
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import {
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
  createTag,
  selectTags,
  updateTags,
} from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";

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
      const mockCreatedTag: Partial<PrismaTag> = {
        tagNameId: "My New Tag!",
        tagTypeId: "Demonstration Type",
        sourceId: "User",
        statusId: "Unapproved",
        createdAt: new Date("2026-09-21"),
        updatedAt: new Date("2026-09-21"),
      };
      vi.mocked(createTag).mockResolvedValue(mockCreatedTag as PrismaTag);
      const result = await tagResolvers.Mutation.createTag(null, { tagName: "My New Tag!" });
      expect(createTag).toHaveBeenCalledExactlyOnceWith("My New Tag!");

      expect(result.tagName).toBe("My New Tag!");
      expect(result.approvalStatus).toBe("Unapproved");
    });
  });

  describe("Mutation.approveTag", () => {
    const testTagName = "My approved tag!";
    const mockInitialTagResult: Partial<PrismaTag>[] = [
      {
        tagNameId: testTagName,
        tagTypeId: "Demonstration Type",
        statusId: "Unapproved",
      },
      {
        tagNameId: testTagName,
        tagTypeId: "Application",
        statusId: "Unapproved",
      },
    ];

    const mockUpdateTagResult: Partial<PrismaTag>[] = [
      {
        tagNameId: testTagName,
        tagTypeId: "Demonstration Type",
        statusId: "Approved",
      },
      {
        tagNameId: testTagName,
        tagTypeId: "Application",
        statusId: "Approved",
      },
    ];

    beforeEach(() => {
      vi.mocked(selectTags).mockResolvedValue(mockInitialTagResult as PrismaTag[]);
      vi.mocked(updateTags).mockResolvedValue(mockUpdateTagResult as PrismaTag[]);
    });

    it("should call selectTags and updateTags with the right arguments", async () => {
      const result = await tagResolvers.Mutation.approveTag(null, { tagName: testTagName });

      expect(result).toStrictEqual({ tagName: testTagName, approvalStatus: "Approved" });
      expect(selectTags).toHaveBeenCalledExactlyOnceWith({
        tagNameId: testTagName,
        tagTypeId: { in: EDITABLE_TAG_TYPES },
      });
      expect(throwCustomGQLError).not.toHaveBeenCalled();
      expect(updateTags).toHaveBeenCalledExactlyOnceWith(
        {
          tagNameId: testTagName,
          statusId: "Unapproved",
          tagTypeId: { in: EDITABLE_TAG_TYPES },
        },
        {
          statusId: "Approved",
        }
      );
    });

    it("should not throw and simply return if all tags are already approved", async () => {
      const mockApprovedTagResult: Partial<PrismaTag>[] = mockInitialTagResult.map((tag) => ({
        ...tag,
        statusId: "Approved",
      }));
      vi.mocked(selectTags).mockResolvedValue(mockApprovedTagResult as PrismaTag[]);

      const result = await tagResolvers.Mutation.approveTag(null, { tagName: testTagName });

      expect(result).toStrictEqual({ tagName: testTagName, approvalStatus: "Approved" });
      expect(selectTags).toHaveBeenCalledExactlyOnceWith({
        tagNameId: testTagName,
        tagTypeId: { in: EDITABLE_TAG_TYPES },
      });
      expect(throwCustomGQLError).not.toHaveBeenCalled();
      expect(updateTags).not.toHaveBeenCalled();
    });

    it("should throw an error if the tag does not exist at all", async () => {
      const mockEmptyResult: Partial<PrismaTag>[] = [];
      vi.mocked(selectTags).mockResolvedValue(mockEmptyResult as PrismaTag[]);

      await expect(
        tagResolvers.Mutation.approveTag(null, { tagName: testTagName })
      ).rejects.toThrow(testCustomGQLError);

      expect(selectTags).toHaveBeenCalledExactlyOnceWith({
        tagNameId: testTagName,
        tagTypeId: { in: EDITABLE_TAG_TYPES },
      });
      expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
        `Attempted to approve tag ${testTagName} but this tag does not exist.`,
        "TAG_DOES_NOT_EXIST_ERROR"
      );
      expect(updateTags).not.toHaveBeenCalled();
    });
  });
});
