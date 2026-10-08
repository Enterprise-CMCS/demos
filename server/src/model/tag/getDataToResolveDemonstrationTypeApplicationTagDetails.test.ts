// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Tag as PrismaTag } from "@prisma/client";
import { SemVer } from "semver";

// Functions under test
import { getDataToResolveDemonstrationTypeApplicationTagDetails } from "./getDataToResolveDemonstrationTypeApplicationTagDetails";

// Mock imports
vi.mock(".", () => ({
  selectTags: vi.fn(),
}));

// Thrown by the mocked throwCustomGQLError
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

// Thrown by the mocked throwApiNotReleasedError
const testApiNotReleasedError = new Error("Test throwApiNotReleasedError!");
vi.mock("../../flags/throwApiNotReleasedError", () => ({
  throwApiNotReleasedError: vi.fn(() => {
    throw testApiNotReleasedError;
  }),
}));

import { selectTags } from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { throwApiNotReleasedError } from "../../flags/throwApiNotReleasedError";

describe("getDataToResolveDemonstrationTypeApplicationTagDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should throw if the version number is lower than the release number", async () => {
    await expect(
      getDataToResolveDemonstrationTypeApplicationTagDetails("test tag name", new SemVer("1.1.0"))
    ).rejects.toThrow(testApiNotReleasedError);

    expect(throwApiNotReleasedError).toHaveBeenCalledExactlyOnceWith("tagDetails");
    expect(selectTags).not.toHaveBeenCalled();
    expect(throwCustomGQLError).not.toHaveBeenCalled();
  });

  it("should throw if no tags are returned by the query", async () => {
    vi.mocked(selectTags).mockResolvedValue([]);

    await expect(
      getDataToResolveDemonstrationTypeApplicationTagDetails("test tag name", new SemVer("1.2.0"))
    ).rejects.toThrow(testCustomGQLError);

    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith({
      tagNameId: "test tag name",
      tagTypeId: { in: ["Demonstration Type", "Application"] },
    });
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "A tag with name 'test tag name' could not be found.",
      "TAG_DOES_NOT_EXIST_ERROR"
    );
  });

  it("should return the demonstration type tag entry if both are returned by the query", async () => {
    const mockedQueryResult: Partial<PrismaTag>[] = [
      {
        tagNameId: "test tag name",
        tagTypeId: "Demonstration Type",
        statusId: "Approved",
      },
      {
        tagNameId: "test tag name",
        tagTypeId: "Application",
        statusId: "Unapproved",
      },
    ];
    vi.mocked(selectTags).mockResolvedValue(mockedQueryResult as PrismaTag[]);

    const result = await getDataToResolveDemonstrationTypeApplicationTagDetails(
      "test tag name",
      new SemVer("1.2.0")
    );

    expect(result.tagName).toBe("test tag name");
    expect(result.approvalStatus).toBe("Approved");
    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith({
      tagNameId: "test tag name",
      tagTypeId: { in: ["Demonstration Type", "Application"] },
    });
    expect(throwCustomGQLError).not.toHaveBeenCalled();
  });

  it("should return the application tag entry if it is the only one returned", async () => {
    const mockedQueryResult: Partial<PrismaTag>[] = [
      {
        tagNameId: "test tag name",
        tagTypeId: "Application",
        statusId: "Unapproved",
      },
    ];
    vi.mocked(selectTags).mockResolvedValue(mockedQueryResult as PrismaTag[]);

    const result = await getDataToResolveDemonstrationTypeApplicationTagDetails(
      "test tag name",
      new SemVer("1.2.0")
    );

    expect(result.tagName).toBe("test tag name");
    expect(result.approvalStatus).toBe("Unapproved");
    expect(throwApiNotReleasedError).not.toHaveBeenCalled();
    expect(selectTags).toHaveBeenCalledExactlyOnceWith({
      tagNameId: "test tag name",
      tagTypeId: { in: ["Demonstration Type", "Application"] },
    });
    expect(throwCustomGQLError).not.toHaveBeenCalled();
  });
});
