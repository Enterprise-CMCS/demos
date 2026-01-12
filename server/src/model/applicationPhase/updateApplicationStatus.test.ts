import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateApplicationStatus, updateStatusToUnderReviewIfNeeded } from "./updateApplicationStatus";
import { ApplicationType, ApplicationStatus } from "../../types";

describe("updateApplicationStatus", () => {
  const testApplicationId = "test-app-123";
  
  const mockTransaction = {
    application: {
      findUnique: vi.fn(),
    },
    demonstration: {
      update: vi.fn(),
    },
    amendment: {
      update: vi.fn(),
    },
    extension: {
      update: vi.fn(),
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("updateApplicationStatus", () => {
    it("should update status for demonstration", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Demonstration",
      });

      await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);

      expect(mockTransaction.application.findUnique).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        select: { applicationTypeId: true },
      });
      expect(mockTransaction.demonstration.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should update status for amendment", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Amendment",
      });

      await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);

      expect(mockTransaction.amendment.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should update status for extension", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Extension",
      });

      await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);

      expect(mockTransaction.extension.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should throw error for unknown application type", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Unknown",
      });

      await expect(
        updateApplicationStatus(testApplicationId, "Under Review", mockTransaction)
      ).rejects.toThrow("Unknown application type: Unknown");
    });

    it("should throw error when application not found", async () => {
      mockTransaction.application.findUnique.mockResolvedValue(null);

      await expect(
        updateApplicationStatus(testApplicationId, "Under Review", mockTransaction)
      ).rejects.toThrow(`Application with id ${testApplicationId} not found`);
    });
  });

  describe("updateStatusToUnderReviewIfNeeded", () => {
    it("should update status from Pre-Submission to Under Review for demonstration", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Demonstration",
        demonstration: { statusId: "Pre-Submission" },
        amendment: null,
        extension: null,
      });

      const result = await updateStatusToUnderReviewIfNeeded(testApplicationId, mockTransaction);

      expect(result).toBe(true);
      expect(mockTransaction.demonstration.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should not update status if not Pre-Submission", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Demonstration",
        demonstration: { statusId: "Under Review" },
        amendment: null,
        extension: null,
      });

      const result = await updateStatusToUnderReviewIfNeeded(testApplicationId, mockTransaction);

      expect(result).toBe(false);
      expect(mockTransaction.demonstration.update).not.toHaveBeenCalled();
    });

    it("should handle amendment applications", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Amendment",
        demonstration: null,
        amendment: { statusId: "Pre-Submission" },
        extension: null,
      });

      const result = await updateStatusToUnderReviewIfNeeded(testApplicationId, mockTransaction);

      expect(result).toBe(true);
      expect(mockTransaction.amendment.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should handle extension applications", async () => {
      mockTransaction.application.findUnique.mockResolvedValue({
        applicationTypeId: "Extension",
        demonstration: null,
        amendment: null,
        extension: { statusId: "Pre-Submission" },
      });

      const result = await updateStatusToUnderReviewIfNeeded(testApplicationId, mockTransaction);

      expect(result).toBe(true);
      expect(mockTransaction.extension.update).toHaveBeenCalledWith({
        where: { id: testApplicationId },
        data: { statusId: "Under Review" },
      });
    });

    it("should throw error when application not found", async () => {
      mockTransaction.application.findUnique.mockResolvedValue(null);

      await expect(
        updateStatusToUnderReviewIfNeeded(testApplicationId, mockTransaction)
      ).rejects.toThrow(`Application with id ${testApplicationId} not found`);
    });
  });
});
