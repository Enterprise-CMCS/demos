import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationStatus } from "../../../types.js";
import { updateApplicationStatus } from "./updateApplicationStatus.js";

// Mock imports
import { getApplicationType } from "..";

vi.mock("..", () => ({
  getApplicationType: vi.fn(),
}));

describe("updateApplicationStatus", () => {
  const transactionMocks = {
    demonstration: {
      update: vi.fn(),
    },
    amendment: {
      update: vi.fn(),
    },
    extension: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstration: {
      update: transactionMocks.demonstration.update,
    },
    amendment: {
      update: transactionMocks.amendment.update,
    },
    extension: {
      update: transactionMocks.extension.update,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testApplicationStatus: ApplicationStatus = "Denied";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request run the update against demonstration if the application is a demonstration", async () => {
    vi.mocked(getApplicationType).mockResolvedValueOnce("Demonstration");
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
      data: {
        statusId: testApplicationStatus,
      },
    };

    await updateApplicationStatus(mockTransaction, testApplicationId, testApplicationStatus);
    expect(getApplicationType).toHaveBeenCalledExactlyOnceWith(mockTransaction, testApplicationId);
    expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should request run the update against amendment if the application is an amendment", async () => {
    vi.mocked(getApplicationType).mockResolvedValueOnce("Amendment");
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
      data: {
        statusId: testApplicationStatus,
      },
    };

    await updateApplicationStatus(mockTransaction, testApplicationId, testApplicationStatus);
    expect(getApplicationType).toHaveBeenCalledExactlyOnceWith(mockTransaction, testApplicationId);
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should request run the update against extension if the application is an extension", async () => {
    vi.mocked(getApplicationType).mockResolvedValueOnce("Extension");
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
      data: {
        statusId: testApplicationStatus,
      },
    };

    await updateApplicationStatus(mockTransaction, testApplicationId, testApplicationStatus);
    expect(getApplicationType).toHaveBeenCalledExactlyOnceWith(mockTransaction, testApplicationId);
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
