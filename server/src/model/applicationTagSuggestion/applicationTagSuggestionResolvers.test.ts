import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  acceptApplicationTagSuggestion,
  replaceApplicationTagSuggestion,
  removeApplicationTagSuggestion,
} from "./applicationTagSuggestionResolvers";

// Mock imports
import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
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

  const applicationId = "app-id";
  const value = "NewTag";
  const existingTags = [{ tagNameId: "Tag1" }, { tagNameId: "Tag2" }];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("acceptApplicationTagSuggestion", () => {
    it("should accept suggestion and add tag if not present", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        applicationId,
        value,
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);
      vi.mocked(setApplicationTags).mockResolvedValue({ id: applicationId } as any);

      const result = await acceptApplicationTagSuggestion(undefined, {
        applicationId,
        value,
      });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
        data: { statusId: "Accepted" },
      });

      expect(setApplicationTags).toHaveBeenCalledWith(undefined, {
        input: {
          applicationId,
          applicationTags: ["Tag1", "Tag2", "NewTag"],
        },
      });

      expect(result).toEqual({ id: applicationId });
    });

    it("should not duplicate tag if already present", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        applicationId,
        value: "Tag1",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      await acceptApplicationTagSuggestion(undefined, {
        applicationId,
        value: "Tag1",
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
          applicationId,
          value,
        })
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledWith(testError);
    });
  });

  describe("replaceApplicationTagSuggestion", () => {
    it("should add new value if old one not found", async () => {
      mockTx.applicationTagSuggestion.findUniqueOrThrow.mockResolvedValue({
        applicationId,
        value: "MissingTag",
      });

      mockTx.applicationTagAssignment.findMany.mockResolvedValue(existingTags);

      await replaceApplicationTagSuggestion(undefined, {
        applicationId,
        value: "MissingTag",
        newValue: "NewTag",
      });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: {
          applicationId_value: {
            applicationId,
            value: "MissingTag",
          },
        },
        data: { statusId: "Replaced", replacedValue: "NewTag" },
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
          applicationId,
          value,
          newValue: "NewTag",
        })
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledWith(testError);
    });
  });

  describe("removeApplicationTagSuggestion", () => {
    it("should mark suggestion as removed", async () => {
      await removeApplicationTagSuggestion(undefined, { applicationId, value });

      expect(mockTx.applicationTagSuggestion.update).toHaveBeenCalledWith({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
        data: { statusId: "Removed" },
      });
    });

    it("should handle errors", async () => {
      const testError = new Error("DB error");
      vi.mocked(prisma).mockRejectedValueOnce(testError);

      await expect(
        removeApplicationTagSuggestion(undefined, { applicationId, value })
      ).rejects.toThrow(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalled();
    });
  });
});
