import { describe, it, expect, vi, beforeEach } from "vitest";
import { setApplicationClearanceLevel } from "./setApplicationClearanceLevel";
import { ApplicationType, ClearanceLevel } from "../../types";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";

// Mock imports
import { getApplication } from ".";
import { prisma } from "../../prismaClient.js";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { handlePrismaError } from "../../errors/handlePrismaError";

vi.mock(".", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../applicationPhase", () => ({
  getFinishedApplicationPhaseIds: vi.fn(),
}));

describe("setApplicationClearanceLevel", () => {
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
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testClearanceLevel: ClearanceLevel = "CMS (OSORA)";

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

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should update clearance level for a demonstration", async () => {
    // The returned application object is not a full record but contains all relevant elements
    vi.mocked(getApplication).mockResolvedValueOnce(mockDemonstration as PrismaDemonstration);
    vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValueOnce([]);
    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await setApplicationClearanceLevel(undefined, { input });

    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId
    );
    expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: testApplicationId },
      data: { clearanceLevelId: testClearanceLevel },
    });
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should update clearance level for an amendment", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockAmendment as PrismaAmendment);
    vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValueOnce([]);
    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await setApplicationClearanceLevel(undefined, { input });

    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId
    );
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: testApplicationId },
      data: { clearanceLevelId: testClearanceLevel },
    });
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should update clearance level for an extension", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockExtension as PrismaExtension);
    vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValueOnce([]);
    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await setApplicationClearanceLevel(undefined, { input });

    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId
    );
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: testApplicationId },
      data: { clearanceLevelId: testClearanceLevel },
    });
  });

  it("should handle errors when updating clearance level", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockDemonstration as PrismaAmendment);

    const testError = new Error("Database update failed");
    vi.mocked(getFinishedApplicationPhaseIds).mockRejectedValueOnce(testError);

    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await expect(setApplicationClearanceLevel(undefined, { input })).rejects.toThrowError(
      testHandlePrismaError
    );
    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    expect(getFinishedApplicationPhaseIds).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId
    );
    expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
  });

  it("should handle errors when application is not found", async () => {
    const testError = new Error("Database update failed");
    vi.mocked(getApplication).mockRejectedValueOnce(testError);

    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await expect(setApplicationClearanceLevel(undefined, { input })).rejects.toThrowError();
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should prevent clearance level update when Review phase is finished", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockExtension as PrismaExtension);
    vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue(["Application Intake", "Review"]);

    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await expect(setApplicationClearanceLevel(undefined, { input })).rejects.toThrowError(
      testHandlePrismaError
    );
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).not.toHaveBeenCalled();
  });

  it("should allow clearance level update when Review phase is not finished", async () => {
    vi.mocked(getApplication).mockResolvedValueOnce(mockExtension as PrismaExtension);
    vi.mocked(getFinishedApplicationPhaseIds).mockResolvedValue([
      "Application Intake",
      "SDG Preparation",
    ]);

    const input = {
      applicationId: testApplicationId,
      clearanceLevel: testClearanceLevel,
    };

    await setApplicationClearanceLevel(undefined, { input });
    expect(transactionMocks.demonstration.update).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.update).not.toHaveBeenCalled();
    expect(transactionMocks.extension.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: testApplicationId },
      data: { clearanceLevelId: testClearanceLevel },
    });
  });
});
