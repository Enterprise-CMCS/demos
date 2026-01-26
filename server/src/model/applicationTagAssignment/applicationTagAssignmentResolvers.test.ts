import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetApplicationTagsInput } from "../../types";
import { setApplicationTags } from "./applicationTagAssignmentResolvers";

// Mock imports
import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication } from "../application/applicationResolvers";
import {
  createApplicationTagsDemonstrationTypesIfNotExists,
  deleteAllApplicationTags,
  insertApplicationTags,
} from ".";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application/applicationResolvers", () => ({
  getApplication: vi.fn(),
}));

vi.mock(".", () => ({
  createApplicationTagsDemonstrationTypesIfNotExists: vi.fn(),
  deleteAllApplicationTags: vi.fn(),
  insertApplicationTags: vi.fn(),
}));

describe("applicationTagAssignmentResolvers", () => {
  const mockTransaction: any = "Test Transaction";
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testApplicationId = "bd95ae0c-1df9-405c-8a2c-d1791b1d399d";
  const testTags = ["Test Tag 1", "Some Tags", "Tagging"];
  const testError = new Error("Database connection failed");

  const testInput: SetApplicationTagsInput = {
    applicationId: testApplicationId,
    applicationTags: testTags,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("setApplicationTags", () => {
    it("should call functions to create tags and then drop and replace them", async () => {
      await setApplicationTags(undefined, { input: testInput });

      expect(createApplicationTagsDemonstrationTypesIfNotExists).toHaveBeenCalledExactlyOnceWith(
        testTags,
        mockTransaction
      );
      expect(deleteAllApplicationTags).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        mockTransaction
      );
      expect(insertApplicationTags).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        testTags,
        mockTransaction
      );
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle if one of the functions throws an error", async () => {
      vi.mocked(deleteAllApplicationTags).mockRejectedValueOnce(testError);

      await expect(setApplicationTags(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(createApplicationTagsDemonstrationTypesIfNotExists).toHaveBeenCalledExactlyOnceWith(
        testTags,
        mockTransaction
      );
      expect(deleteAllApplicationTags).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        mockTransaction
      );
      expect(insertApplicationTags).not.toHaveBeenCalled();
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });
});
