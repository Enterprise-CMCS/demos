import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  acceptApplicationTagSuggestion,
  replaceApplicationTagSuggestion,
  removeApplicationTagSuggestion,
} from "./applicationTagSuggestionResolvers";

// Mock imports
import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication } from "../application";
import { setApplicationTags } from "../applicationTagAssignment";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../applicationTagAssignment", () => ({
  setApplicationTags: vi.fn(),
}));

describe("applicationTagSuggestionResolvers", () => {
  const mockTx = {
    applicationTagSuggestion: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    applicationTagAssignment: {
      findMany: vi.fn(),
    },
  };

  const mockPrismaClient = {
    $transaction: vi.fn((cb) => cb(mockTx)),
  };

  const suggestionId = "suggestion-id";
  const applicationId = "app-id";
  const existingTags = [{ tagNameId: "Tag1" }, { tagNameId: "Tag2" }];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("acceptApplicationTagSuggestion", () => {
    it("should accept suggestion and add tag if not present", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        id: suggestionId,
        applicationId,
        value: "NewTag",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      vi.mocked(getApplication).mockResolvedValue({ id: applicationId } as any);

      const result = await acceptApplicationTagSuggestion(undefined, {
        input: { suggestionId, applicationId },
      });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: { id: suggestionId },
        data: { status: { connect: { id: "Accepted" } } },
      });

      expect(setApplicationTags).toHaveBeenCalledWith(undefined, {
        input: {
          applicationId,
          applicationTags: ["Tag1", "Tag2", "NewTag"],
        },
      });

      expect(getApplication).toHaveBeenCalledWith(applicationId);
      expect(result).toEqual({ id: applicationId });
    });

    it("should not duplicate tag if already present", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        id: suggestionId,
        applicationId,
        value: "Tag1",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      vi.mocked(getApplication).mockResolvedValue({ id: applicationId } as any);

      await acceptApplicationTagSuggestion(undefined, {
        input: { suggestionId, applicationId },
      });

      expect(setApplicationTags).toHaveBeenCalledWith(undefined, {
        input: {
          applicationId,
          applicationTags: ["Tag1", "Tag2"],
        },
      });
    });

    it("should handle errors", async () => {
      const testError = new Error("DB error");

      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockRejectedValue(testError);

      await expect(
        acceptApplicationTagSuggestion(undefined, {
          input: { suggestionId, applicationId },
        })
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });

  describe("replaceApplicationTagSuggestion", () => {
    it("should replace existing tag value", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        id: suggestionId,
        applicationId,
        value: "Tag1",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      await replaceApplicationTagSuggestion(undefined, {
        suggestionId,
        newValue: "ReplacedTag",
      });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: { id: suggestionId },
        data: { status: { connect: { id: "Replaced" } } },
      });

      expect(setApplicationTags).toHaveBeenCalledWith(undefined, {
        input: {
          applicationId,
          applicationTags: ["ReplacedTag", "Tag2"],
        },
      });
    });

    it("should add new value if old one not found", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        id: suggestionId,
        applicationId,
        value: "MissingTag",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      await replaceApplicationTagSuggestion(undefined, {
        suggestionId,
        newValue: "NewTag",
      });

      expect(setApplicationTags).toHaveBeenCalledWith(undefined, {
        input: {
          applicationId,
          applicationTags: ["Tag1", "Tag2", "NewTag"],
        },
      });
    });

    it("should handle errors", async () => {
      const testError = new Error("DB error");

      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockRejectedValue(testError);

      await expect(
        replaceApplicationTagSuggestion(undefined, {
          suggestionId,
          newValue: "NewTag",
        })
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledWith(testError);
    });
  });

  describe("removeApplicationTagSuggestion", () => {
    it("should mark suggestion as removed", async () => {
      await removeApplicationTagSuggestion(undefined, { suggestionId });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: { id: suggestionId },
        data: {
          status: { connect: { id: "Removed" } },
        },
      });
    });

    it("should handle errors", async () => {
      const testError = new Error("DB error");
      vi.mocked(prisma).mockRejectedValueOnce(testError);

      await expect(
        removeApplicationTagSuggestion(undefined, { suggestionId })
      ).rejects.toThrow(testHandlePrismaError);
      
      expect(handlePrismaError).toHaveBeenCalled();
    });
  });
});