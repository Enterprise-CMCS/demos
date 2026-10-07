// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __DEMOS_VERSION__ } from "../../flags";

// Types
import type { Tag as PrismaTag } from "@prisma/client";
import type { GraphQLContext } from "../../auth";
import type { Tag } from "../../types";

// Functions under test
import { tagResolvers } from "./tagResolvers";

// Mock imports
vi.mock(".", () => ({
  approveTags: vi.fn(),
  createTags: vi.fn(),
  deleteTags: vi.fn(),
  getDataToResolveDemonstrationTypeApplicationTagDetails: vi.fn(),
  getDemonstrationTypeSummaryCounts: vi.fn(),
  getFormattedTagsByTagType: vi.fn(),
}));

vi.mock("../amendment", () => ({
  getManyAmendments: vi.fn(),
}));

vi.mock("../deliverable", () => ({
  getManyDeliverables: vi.fn(),
}));

vi.mock("../demonstration", () => ({
  getManyDemonstrations: vi.fn(),
}));

vi.mock("../extension", () => ({
  getManyExtensions: vi.fn(),
}));

vi.mock("../referenceConfiguration/queries", () => ({
  selectManyReferenceConfigurations: vi.fn(),
}));

import {
  approveTags,
  createTags,
  deleteTags,
  getDataToResolveDemonstrationTypeApplicationTagDetails,
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
} from ".";
import { getManyAmendments } from "../amendment";
import { getManyDeliverables } from "../deliverable";
import { getManyDemonstrations } from "../demonstration";
import { getManyExtensions } from "../extension";
import { selectManyReferenceConfigurations } from "../referenceConfiguration/queries";

describe("tagResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Query.demonstrationTypeOptions", () => {
    it("should defer to getFormattedTagsByTagType with correct params", async () => {
      await tagResolvers.Query.demonstrationTypeOptions();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Demonstration Type");
    });
  });

  describe("Query.applicationTagOptions", () => {
    it("should defer to getFormattedTagsByTagType with correct params", async () => {
      await tagResolvers.Query.applicationTagOptions();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    });
  });

  describe("Query.demonstrationTypeUsageSummary", () => {
    it("should defer to getDemonstrationTypeSummaryCounts with correct params", async () => {
      await tagResolvers.Query.demonstrationTypeUsageSummary();
      expect(getDemonstrationTypeSummaryCounts).toHaveBeenCalledExactlyOnceWith();
    });
  });

  describe("Query.tagDetails", () => {
    it("should defer to getDataToResolveDemonstrationTypeApplicationTagDetails with correct params", async () => {
      await tagResolvers.Query.tagDetails("Anything for parent", { tagName: "Test Tag Name!" });
      expect(
        getDataToResolveDemonstrationTypeApplicationTagDetails
      ).toHaveBeenCalledExactlyOnceWith("Test Tag Name!", __DEMOS_VERSION__);
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

  const testParentTag: Tag = {
    tagName: "Parent tag!",
    approvalStatus: "Approved",
  };

  const testContext: Partial<GraphQLContext> = {
    user: {
      id: "The Amazing Testo!",
      cognitoSubject: "a3146be0-019a-457d-957a-7b6e0a1aa762",
      personTypeId: "demos-admin",
      permissions: [],
    },
  };

  describe("TagDetail.taggedDemonstrations", () => {
    it("should defer to getManyDemonstrations with correct params", async () => {
      await tagResolvers.TagDetail.taggedDemonstrations(
        testParentTag,
        "Nothing",
        testContext as GraphQLContext
      );
      expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith(
        {
          application: {
            applicationTagAssignments: { some: { tagNameId: testParentTag.tagName } },
          },
        },
        testContext.user
      );
    });
  });

  describe("TagDetail.taggedAmendments", () => {
    it("should defer to getManyAmendments with correct params", async () => {
      await tagResolvers.TagDetail.taggedAmendments(
        testParentTag,
        "Nothing",
        testContext as GraphQLContext
      );
      expect(getManyAmendments).toHaveBeenCalledExactlyOnceWith(
        {
          application: {
            applicationTagAssignments: { some: { tagNameId: testParentTag.tagName } },
          },
        },
        testContext.user
      );
    });
  });

  describe("TagDetail.taggedRenewals", () => {
    it("should defer to getManyExtensions with correct params", async () => {
      await tagResolvers.TagDetail.taggedRenewals(
        testParentTag,
        "Nothing",
        testContext as GraphQLContext
      );
      expect(getManyExtensions).toHaveBeenCalledExactlyOnceWith(
        {
          application: {
            applicationTagAssignments: { some: { tagNameId: testParentTag.tagName } },
          },
        },
        testContext.user
      );
    });
  });

  describe("TagDetail.taggedReferences", () => {
    it("should defer to selectManyReferenceConfigurations with correct params", async () => {
      await tagResolvers.TagDetail.taggedReferences(testParentTag);
      expect(selectManyReferenceConfigurations).toHaveBeenCalledExactlyOnceWith({
        reference: {
          referenceDemonstrationTypes: { some: { tag: { tagNameId: testParentTag.tagName } } },
        },
      });
    });
  });

  describe("TagDetail.assignedDemonstrations", () => {
    it("should defer to getManyDemonstrations with correct params", async () => {
      await tagResolvers.TagDetail.assignedDemonstrations(
        testParentTag,
        "Nothing",
        testContext as GraphQLContext
      );
      expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith(
        {
          demonstrationTypeTagAssignments: { some: { tagNameId: testParentTag.tagName } },
        },
        testContext.user
      );
    });
  });

  describe("TagDetail.assignedDeliverables", () => {
    it("should defer to getManyDeliverables with correct params", async () => {
      await tagResolvers.TagDetail.assignedDeliverables(
        testParentTag,
        "Nothing",
        testContext as GraphQLContext
      );
      expect(getManyDeliverables).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableDemonstrationTypes: {
            some: {
              demonstrationTypeTagNameId: testParentTag.tagName,
            },
          },
        },
        testContext.user
      );
    });
  });
});
