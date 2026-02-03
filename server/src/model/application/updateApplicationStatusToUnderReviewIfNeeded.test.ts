import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationStatus } from "../../types";
import { updateApplicationStatusToUnderReviewIfNeeded } from "./updateApplicationStatusToUnderReviewIfNeeded";
import { Demonstration as PrismaDemonstration } from "@prisma/client";

// Mock imports
import { getApplication, updateApplicationStatus } from ".";

vi.mock(".", () => ({
  getApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

describe("updateApplicationStatus", () => {
  const testApplicationId = "f12aad99-c633-4c06-9547-fa05d274dd46";
  const mockTransaction = "Test transaction" as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should update status from Pre-Submission to Under Review for demonstration", async () => {
    const mockApplicationResult = {
      id: testApplicationId,
      statusId: "Pre-Submission" satisfies ApplicationStatus,
    };
    vi.mocked(getApplication).mockResolvedValueOnce(mockApplicationResult as PrismaDemonstration);

    const result = await updateApplicationStatusToUnderReviewIfNeeded(
      testApplicationId,
      mockTransaction
    );

    expect(result).toBe(true);
    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(updateApplicationStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Under Review",
      mockTransaction
    );
  });

  it("should not update status if it is not Pre-Submission", async () => {
    const mockApplicationResult = {
      id: testApplicationId,
      statusId: "Under Review" satisfies ApplicationStatus,
    };
    vi.mocked(getApplication).mockResolvedValueOnce(mockApplicationResult as PrismaDemonstration);

    const result = await updateApplicationStatusToUnderReviewIfNeeded(
      testApplicationId,
      mockTransaction
    );

    expect(result).toBe(false);
    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(updateApplicationStatus).not.toHaveBeenCalled();
  });
});
