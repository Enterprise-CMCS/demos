// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EDITABLE_TAG_TYPES } from "./approveTag";

// Types
import type { Tag as PrismaTag } from "@prisma/client";

// Functions under test
import { approveTag } from "./approveTag";

// Mock imports
vi.mock(".", () => ({
  selectTags: vi.fn(),
  updateTags: vi.fn(),
}));

// Thrown by the mocked throwApiNotReleasedError
const testApiNotReleasedError = new Error("Test throwApiNotReleasedError!");
vi.mock("../../flags/throwApiNotReleasedError", () => ({
  throwApiNotReleasedError: vi.fn(() => {
    throw testApiNotReleasedError;
  }),
}));

// Thrown by the mocked throwCustomGQLError
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import { selectTags, updateTags } from ".";
import { throwApiNotReleasedError } from "../../flags/throwApiNotReleasedError";
import { throwCustomGQLError } from "../../errors/errorCodes";

describe("approveTag", () => {
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

  it("should throw if the version number is lower than the release number", async () => {
    await expect(approveTag(testTagName, "1.1.0")).rejects.toThrow(testApiNotReleasedError);

    expect(throwApiNotReleasedError).toHaveBeenCalledExactlyOnceWith("approveTag");
    expect(selectTags).not.toHaveBeenCalled();
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("should call selectTags and updateTags with the right arguments", async () => {
    const result = await approveTag(testTagName, "1.2.0");

    expect(result).toStrictEqual({ tagName: testTagName, approvalStatus: "Approved" });
    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
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

    const result = await approveTag(testTagName, "1.2.0");

    expect(result).toStrictEqual({ tagName: testTagName, approvalStatus: "Approved" });
    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
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

    await expect(approveTag(testTagName, "1.2.0")).rejects.toThrow(testCustomGQLError);

    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
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
