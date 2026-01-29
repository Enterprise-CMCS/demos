import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationType } from "../../../types";
import { updateApplicationStatus } from "./updateApplicationStatus";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";

// Mock imports
import { getApplication } from "..";

vi.mock("..", () => ({
  getApplication: vi.fn(),
}));

describe("updateApplicationStatus", () => {
  const testApplicationId = "f12aad99-c633-4c06-9547-fa05d274dd46";

  const mockDemonstration = {
    id: testApplicationId,
    applicationTypeId: "Demonstration" satisfies ApplicationType,
  };
  const mockAmendment = {
    id: testApplicationId,
    applicationTypeId: "Amendment" satisfies ApplicationType,
  };
  const mockExtension = {
    id: testApplicationId,
    applicationTypeId: "Extension" satisfies ApplicationType,
  };

  const mockTransaction = {
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

  it("should update status for demonstration", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockDemonstration as PrismaDemonstration);

    await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);
    expect(mockTransaction.demonstration.update).toHaveBeenCalledWith({
      where: { id: testApplicationId },
      data: { statusId: "Under Review" },
    });
    expect(mockTransaction.amendment.update).not.toHaveBeenCalled();
    expect(mockTransaction.extension.update).not.toHaveBeenCalled();
  });

  it("should update status for amendment", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockAmendment as PrismaAmendment);

    await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);
    expect(mockTransaction.demonstration.update).not.toHaveBeenCalled();
    expect(mockTransaction.amendment.update).toHaveBeenCalledWith({
      where: { id: testApplicationId },
      data: { statusId: "Under Review" },
    });
    expect(mockTransaction.extension.update).not.toHaveBeenCalled();
  });

  it("should update status for extension", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockExtension as PrismaExtension);

    await updateApplicationStatus(testApplicationId, "Under Review", mockTransaction);
    expect(mockTransaction.demonstration.update).not.toHaveBeenCalled();
    expect(mockTransaction.amendment.update).not.toHaveBeenCalled();
    expect(mockTransaction.extension.update).toHaveBeenCalledWith({
      where: { id: testApplicationId },
      data: { statusId: "Under Review" },
    });
  });
});
