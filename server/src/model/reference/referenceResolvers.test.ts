// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { TagName, TagStatus } from "../../types";
import { SelectManyReferenceConfigurationsResult } from "../referenceConfiguration/queries";

// Functions under test
import { referenceResolvers } from "./referenceResolvers";

// Mock imports
vi.mock("../referenceConfiguration/queries", () => ({
  selectManyReferenceConfigurations: vi.fn(),
}));

vi.mock(".", () => ({
  getReferenceDownloadUrl: vi.fn(),
  getReferenceAgreementDownloadUrl: vi.fn(),
}));

import { selectManyReferenceConfigurations } from "../referenceConfiguration/queries";

describe("referenceResolvers", () => {
  const testReferenceConfigurationId = "reference-configuration-1";
  const testReferenceAgreementId = "reference-agreement-1";

  const mockReferenceConfiguration: SelectManyReferenceConfigurationsResult = {
    id: testReferenceConfigurationId,
    statusId: "Active",
    reference: {
      id: "reference-1",
      name: "Reference Name",
      description: "Reference Description",
      referenceTagAssignments: [
        { tag: { tagNameId: "Innovation" as TagName, statusId: "Approved" } },
      ],
      referenceDemonstrationTypes: [
        { tag: { tagNameId: "Primary" as TagName, statusId: "Approved" } },
        { tag: { tagNameId: "Secondary" as TagName, statusId: "Approved" } },
      ],
      s3Path: "some/path",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-06-01"),
    },
    referenceAgreement: {
      id: testReferenceAgreementId,
      name: "Agreement Name",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-06-01"),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Query.references", () => {
    it("queries for active references with no tag filter when no tag is given", async () => {
      await referenceResolvers.Query.references(undefined, { withTag: undefined as any });
      expect(selectManyReferenceConfigurations).toHaveBeenCalledExactlyOnceWith({
        statusId: "Active",
      });
    });

    it("queries for active references with a tag filter when a tag is given", async () => {
      const testTag = "Innovation" as TagName;
      await referenceResolvers.Query.references(undefined, { withTag: testTag });

      expect(selectManyReferenceConfigurations).toHaveBeenCalledExactlyOnceWith({
        reference: {
          referenceTagAssignments: {
            some: {
              tagNameId: testTag,
            },
          },
        },
        statusId: "Active",
      });
    });
  });

  describe("Reference.name", () => {
    it("returns the reference name from the parent", () => {
      const result = referenceResolvers.Reference.name(mockReferenceConfiguration);
      expect(result).toBe(mockReferenceConfiguration.reference!.name);
    });
  });

  describe("Reference.description", () => {
    it("returns the reference description from the parent", () => {
      const result = referenceResolvers.Reference.description(mockReferenceConfiguration);
      expect(result).toBe(mockReferenceConfiguration.reference!.description);
    });
  });

  describe("Reference.agreement", () => {
    it("returns the referenceAgreement from the parent", () => {
      const result = referenceResolvers.Reference.agreement(mockReferenceConfiguration);
      expect(result).toBe(mockReferenceConfiguration.referenceAgreement);
    });
  });

  describe("Reference.tags", () => {
    it("maps referenceTagAssignments to Tag objects", () => {
      const result = referenceResolvers.Reference.tags(mockReferenceConfiguration);
      expect(result).toEqual([{ tagName: "Innovation", approvalStatus: "Approved" as TagStatus }]);
    });
  });

  describe("Reference.demonstrationTypes", () => {
    it("maps referenceDemonstrationTypes to Tag objects", () => {
      const result = referenceResolvers.Reference.demonstrationTypes(mockReferenceConfiguration);
      expect(result).toEqual([
        { tagName: "Primary", approvalStatus: "Approved" as TagStatus },
        { tagName: "Secondary", approvalStatus: "Approved" as TagStatus },
      ]);
    });
  });

  describe("Reference.createdAt", () => {
    it("returns the reference createdAt from the parent", () => {
      const result = referenceResolvers.Reference.createdAt(mockReferenceConfiguration);
      expect(result).toBe(mockReferenceConfiguration.reference!.createdAt);
    });
  });

  describe("Reference.updatedAt", () => {
    it("returns the reference updatedAt from the parent", () => {
      const result = referenceResolvers.Reference.updatedAt(mockReferenceConfiguration);
      expect(result).toBe(mockReferenceConfiguration.reference!.updatedAt);
    });
  });
});
