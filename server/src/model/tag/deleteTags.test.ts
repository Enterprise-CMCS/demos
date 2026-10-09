// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Tag as PrismaTag } from "@prisma/client";
import type { DemonstrationTypeUsageSummary } from "../../types";
import { SemVer } from "semver";

// Functions under test
import { deleteTags } from "./deleteTags";

// Mock imports
vi.mock(".", () => ({
  checkDemonstrationTypeTagsCanBeDeleted: vi.fn(),
  checkTagNamesInExistingTags: vi.fn(),
  deleteTagRecords: vi.fn(),
  getDemonstrationTypeSummaryCounts: vi.fn(),
  selectTags: vi.fn(),
}));

// Thrown by the mocked throwApiNotReleasedError
const testApiNotReleasedError = new Error("Test throwApiNotReleasedError!");
vi.mock("../../flags/throwApiNotReleasedError", () => ({
  throwApiNotReleasedError: vi.fn(() => {
    throw testApiNotReleasedError;
  }),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../tagName", () => ({
  deleteTagNames: vi.fn(),
}));

import {
  checkDemonstrationTypeTagsCanBeDeleted,
  checkTagNamesInExistingTags,
  deleteTagRecords,
  getDemonstrationTypeSummaryCounts,
  selectTags,
} from ".";
import { throwApiNotReleasedError } from "../../flags/throwApiNotReleasedError";
import { prisma } from "../../prismaClient";
import { deleteTagNames } from "../tagName";

describe("deleteTags", () => {
  const mockSelectTagsResult: Partial<PrismaTag>[] = [
    {
      tagNameId: "Unused Demonstration Type Tag",
      tagTypeId: "Demonstration Type",
    },
    {
      tagNameId: "Unused Demonstration Type Tag",
      tagTypeId: "Application",
    },
    {
      tagNameId: "In Use Demonstration Type Tag",
      tagTypeId: "Demonstration Type",
    },
    {
      tagNameId: "In Use Demonstration Type Tag",
      tagTypeId: "Application",
    },
    {
      tagNameId: "Multiple Use Tag",
      tagTypeId: "Demonstration Type",
    },
    {
      tagNameId: "Multiple Use Tag",
      tagTypeId: "Application",
    },
    {
      tagNameId: "Multiple Use Tag",
      tagTypeId: "Reference",
    },
  ];
  const mockSummaryCountResult: Partial<DemonstrationTypeUsageSummary>[] = [
    {
      demonstrationTypeName: "Unused Demonstration Type Tag",
    },
    {
      demonstrationTypeName: "In Use Demonstration Type Tag",
    },
    {
      demonstrationTypeName: "Multiple Use Tag",
    },
    {
      demonstrationTypeName: "Some Other Tag",
    },
    {
      demonstrationTypeName: "Another Excess Tag",
    },
  ];

  const mockTransaction = "I'm a transaction!" as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  beforeEach(() => {
    // Using clear all mocks here to avoid having to reimplement the transaction callback every time
    vi.clearAllMocks();
    vi.mocked(getDemonstrationTypeSummaryCounts).mockResolvedValue(
      mockSummaryCountResult as DemonstrationTypeUsageSummary[]
    );
    vi.mocked(selectTags).mockResolvedValue(mockSelectTagsResult as PrismaTag[]);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should throw if the version number is lower than the release number", async () => {
    await expect(deleteTags(["Does Not Matter Here"], new SemVer("1.1.0"))).rejects.toThrow(
      testApiNotReleasedError
    );

    expect(throwApiNotReleasedError).toHaveBeenCalledExactlyOnceWith("deleteTags");
    expect(prisma).not.toHaveBeenCalled();
    expect(selectTags).not.toHaveBeenCalled();
    expect(checkTagNamesInExistingTags).not.toHaveBeenCalled();
    expect(getDemonstrationTypeSummaryCounts).not.toHaveBeenCalled();
    expect(checkDemonstrationTypeTagsCanBeDeleted).not.toHaveBeenCalled();
    expect(deleteTagRecords).not.toHaveBeenCalled();
    expect(deleteTagNames).not.toHaveBeenCalled();
  });

  it("should remove duplicates in the input, query the database, and check if the input tags match with the returned tags that have deletable types", async () => {
    await deleteTags(
      [
        "Unused Demonstration Type Tag",
        "Unused Demonstration Type Tag",
        "In Use Demonstration Type Tag",
        "Multiple Use Tag",
      ],
      new SemVer("1.2.0")
    );

    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(prisma).toHaveBeenCalledOnce();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith(
      {
        tagNameId: {
          in: [
            "Unused Demonstration Type Tag",
            "In Use Demonstration Type Tag",
            "Multiple Use Tag",
          ],
        },
      },
      mockTransaction
    );
    expect(checkTagNamesInExistingTags).toHaveBeenCalledExactlyOnceWith(
      ["Unused Demonstration Type Tag", "In Use Demonstration Type Tag", "Multiple Use Tag"],
      mockSelectTagsResult.slice(0, 6)
    );
  });

  it("should get the usage summaries and then check the input tag names for deletability", async () => {
    await deleteTags(
      ["Unused Demonstration Type Tag", "In Use Demonstration Type Tag", "Multiple Use Tag"],
      new SemVer("1.2.0")
    );

    expect(getDemonstrationTypeSummaryCounts).toHaveBeenCalledExactlyOnceWith(mockTransaction);
    expect(checkDemonstrationTypeTagsCanBeDeleted).toHaveBeenCalledExactlyOnceWith(
      mockSummaryCountResult.slice(0, 3)
    );
  });

  it("should call deleteTagRecords and deleteTagNames with the expected arguments", async () => {
    await deleteTags(
      ["Unused Demonstration Type Tag", "In Use Demonstration Type Tag", "Multiple Use Tag"],
      new SemVer("1.2.0")
    );

    expect(deleteTagRecords).toHaveBeenCalledExactlyOnceWith(
      {
        tagNameId: {
          in: [
            "Unused Demonstration Type Tag",
            "In Use Demonstration Type Tag",
            "Multiple Use Tag",
          ],
        },
        tagTypeId: { in: ["Demonstration Type", "Application"] },
      },
      mockTransaction
    );
    expect(deleteTagNames).toHaveBeenCalledExactlyOnceWith(
      {
        id: {
          in: [
            "Unused Demonstration Type Tag",
            "In Use Demonstration Type Tag",
            "Multiple Use Tag",
          ],
        },
        NOT: { id: { in: ["Multiple Use Tag"] } },
      },
      mockTransaction
    );
  });
});
