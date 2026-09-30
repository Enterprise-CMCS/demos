// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Tag as PrismaTag } from "@prisma/client";
import type { Tag, TagType } from "../../types";

// Functions under test
import { approveTags } from "./approveTags";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

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

import { prisma } from "../../prismaClient";
import { selectTags, updateTags } from ".";
import { throwApiNotReleasedError } from "../../flags/throwApiNotReleasedError";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { SemVer } from "semver";

describe("approveTags", () => {
  const approvableTagTypes: TagType[] = ["Demonstration Type", "Application"];
  const testTagNames = [
    "My approved tag!",
    "My unapproved tag!",
    "My first slightly broken tag!",
    "My other slightly broken tag!",
  ];
  const mockInitialTagResult: Partial<PrismaTag>[] = [
    {
      tagNameId: testTagNames[0],
      tagTypeId: "Demonstration Type",
      statusId: "Approved",
    },
    {
      tagNameId: testTagNames[0],
      tagTypeId: "Application",
      statusId: "Approved",
    },
    {
      tagNameId: testTagNames[1],
      tagTypeId: "Demonstration Type",
      statusId: "Unapproved",
    },
    {
      tagNameId: testTagNames[1],
      tagTypeId: "Application",
      statusId: "Unapproved",
    },
    {
      tagNameId: testTagNames[2],
      tagTypeId: "Demonstration Type",
      statusId: "Unapproved",
    },
    {
      tagNameId: testTagNames[3],
      tagTypeId: "Application",
      statusId: "Approved",
    },
  ];
  const mockUpdateTagResult: Partial<PrismaTag>[] = [
    {
      tagNameId: testTagNames[1],
      tagTypeId: "Demonstration Type",
      statusId: "Approved",
    },
    {
      tagNameId: testTagNames[1],
      tagTypeId: "Application",
      statusId: "Approved",
    },
    {
      tagNameId: testTagNames[2],
      tagTypeId: "Demonstration Type",
      statusId: "Approved",
    },
  ];
  const mockTransaction = "I'm a transaction"! as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  beforeEach(() => {
    // Using clear all mocks here to avoid having to reimplement the transaction callback every time
    vi.clearAllMocks();
    vi.mocked(selectTags).mockResolvedValue(mockInitialTagResult as PrismaTag[]);
    vi.mocked(updateTags).mockResolvedValue(mockUpdateTagResult as PrismaTag[]);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should throw if the version number is lower than the release number", async () => {
    await expect(approveTags(testTagNames, new SemVer("1.1.0"))).rejects.toThrow(
      testApiNotReleasedError
    );

    expect(throwApiNotReleasedError).toHaveBeenCalledExactlyOnceWith("approveTags");
    expect(prisma).not.toHaveBeenCalled();
    expect(selectTags).not.toHaveBeenCalled();
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("should call selectTags and updateTags with the right arguments", async () => {
    const expectedResult: Tag[] = [
      { tagName: testTagNames[0], approvalStatus: "Approved" },
      { tagName: testTagNames[1], approvalStatus: "Approved" },
      { tagName: testTagNames[2], approvalStatus: "Approved" },
      { tagName: testTagNames[3], approvalStatus: "Approved" },
    ];
    const result = await approveTags(testTagNames, new SemVer("1.2.0"));

    expect(result).toHaveLength(expectedResult.length);
    expect(result).toEqual(expect.arrayContaining(expectedResult));
    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(prisma).toHaveBeenCalledOnce();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith(
      {
        tagNameId: { in: testTagNames },
        tagTypeId: { in: approvableTagTypes },
      },
      mockTransaction
    );
    expect(throwCustomGQLError).not.toHaveBeenCalled();
    expect(updateTags).toHaveBeenCalledExactlyOnceWith(
      {
        tagNameId: { in: [testTagNames[1], testTagNames[2]] },
        statusId: "Unapproved",
        tagTypeId: { in: approvableTagTypes },
      },
      {
        statusId: "Approved",
      },
      mockTransaction
    );
  });

  it("should throw an error if one or more of the input tags do not exist at all", async () => {
    const testInput = [...testTagNames, "Not a tag", "also not a tag"];
    await expect(approveTags(testInput, new SemVer("1.2.0"))).rejects.toThrow(testCustomGQLError);

    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(prisma).toHaveBeenCalledOnce();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith(
      {
        tagNameId: { in: testInput },
        tagTypeId: { in: approvableTagTypes },
      },
      mockTransaction
    );
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Attempted to approve tags that do not exist: Not a tag, also not a tag.",
      "TAG_DOES_NOT_EXIST_ERROR"
    );
    expect(updateTags).not.toHaveBeenCalled();
  });
});
