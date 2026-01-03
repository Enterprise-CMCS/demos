import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkReviewPhaseNotCompleted } from "./checkReviewPhaseNotCompleted";
import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseStatus } from "../../types";

// Mock imports
import { getApplicationPhaseStatus } from "../applicationPhase";

vi.mock("../applicationPhase", () => ({
  getApplicationPhaseStatus: vi.fn(),
}));

describe("checkReviewPhaseNotCompleted", () => {
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const mockTransaction = {} as PrismaTransactionClient;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("when Review phase is NOT completed", () => {
    it("should not throw an error when Review phase status is 'Not Started'", async () => {
      vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Not Started");

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).resolves.not.toThrow();

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });

    it("should not throw an error when Review phase status is 'Started'", async () => {
      vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Started");

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).resolves.not.toThrow();

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });

    it("should not throw an error when Review phase status is 'Incomplete'", async () => {
      vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Incomplete");

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).resolves.not.toThrow();

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });

    it("should not throw an error when Review phase status is 'Skipped'", async () => {
      vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Skipped");

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).resolves.not.toThrow();

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });
  });

  describe("when Review phase IS completed", () => {
    it("should throw an error with the correct message when Review phase status is 'Completed'", async () => {
      vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Completed");

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).rejects.toThrow(
        "Cannot change the clearance level of an application whose Review phase is completed."
      );

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });
  });

  describe("edge cases", () => {
    it("should propagate errors from getApplicationPhaseStatus", async () => {
      const testError = new Error("Database connection failed");
      vi.mocked(getApplicationPhaseStatus).mockRejectedValue(testError);

      await expect(
        checkReviewPhaseNotCompleted(mockTransaction, testApplicationId)
      ).rejects.toThrow("Database connection failed");

      expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
    });
  });
});
