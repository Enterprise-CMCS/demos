import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __resolveApplicationPhaseDates,
  __resolveApplicationPhaseDocuments,
  __resolveApplicationPhaseName,
  __resolveApplicationPhaseStatus,
  __setApplicationPhaseStatus,
} from "./applicationPhaseResolvers.js";
import { ApplicationPhase as PrismaApplicationPhase } from "@prisma/client";
import { PhaseName, PhaseStatus, SetApplicationPhaseStatusInput } from "../../types.js";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application";
import { completePhase, declareCompletenessPhaseIncomplete, skipConceptPhase } from ".";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock(".", () => ({
  completePhase: vi.fn(),
  skipConceptPhase: vi.fn(),
  declareCompletenessPhaseIncomplete: vi.fn(),
}));

describe("applicationPhaseResolvers", () => {
  const mockUpsert = vi.fn();
  const mockFindMany = vi.fn();
  const mockTransaction: any = vi.fn();
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    applicationDate: {
      findMany: mockFindMany,
    },
    applicationPhase: {
      upsert: mockUpsert,
    },
    document: {
      findMany: mockFindMany,
    },
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testPhaseId: PhaseName = "Completeness";
  const testPhaseStatusId: PhaseStatus = "Started";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testInput: PrismaApplicationPhase = {
    applicationId: testApplicationId,
    phaseId: testPhaseId,
    phaseStatusId: testPhaseStatusId,
    createdAt: testDateValue,
    updatedAt: testDateValue,
  };
  const testError = new Error("Database connection failed");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__setApplicationPhaseStatus", () => {
    const testInput: SetApplicationPhaseStatusInput = {
      applicationId: testApplicationId,
      phaseName: testPhaseId,
      phaseStatus: testPhaseStatusId,
    };

    it("should upsert phase status and return the updated application", async () => {
      const expectedCall = {
        where: {
          applicationId_phaseId: {
            applicationId: testApplicationId,
            phaseId: testPhaseId,
          },
        },
        update: {
          phaseStatusId: testPhaseStatusId,
        },
        create: {
          applicationId: testApplicationId,
          phaseId: testPhaseId,
          phaseStatusId: testPhaseStatusId,
        },
      };

      await __setApplicationPhaseStatus(undefined, { input: testInput });
      expect(mockUpsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      expect(completePhase).not.toHaveBeenCalled();
      expect(skipConceptPhase).not.toHaveBeenCalled();
    });

    it("should throw when attempting to operate against the Federal Comment phase", async () => {
      const testInput: SetApplicationPhaseStatusInput = {
        applicationId: testApplicationId,
        phaseName: "Federal Comment",
        phaseStatus: "Completed",
      };
      const expectedError =
        "Operations against the Federal Comment phase are not permitted via API.";

      await expect(
        __setApplicationPhaseStatus(undefined, { input: testInput })
      ).rejects.toThrowError(expectedError);
    });

    it("should use the completePhase method when getting a phase completion request", async () => {
      const testInput: SetApplicationPhaseStatusInput = {
        applicationId: testApplicationId,
        phaseName: testPhaseId,
        phaseStatus: "Completed",
      };

      await __setApplicationPhaseStatus(undefined, { input: testInput });
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(getApplication).not.toHaveBeenCalled();
      expect(completePhase).toHaveBeenCalledExactlyOnceWith(undefined, {
        input: { applicationId: testApplicationId, phaseName: testPhaseId },
      });
      expect(skipConceptPhase).not.toHaveBeenCalled();
      expect(declareCompletenessPhaseIncomplete).not.toHaveBeenCalled();
    });

    it("should use the skipConceptPhase method when getting a phase skip request for Concept", async () => {
      const testInput: SetApplicationPhaseStatusInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
        phaseStatus: "Skipped",
      };

      await __setApplicationPhaseStatus(undefined, { input: testInput });
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(getApplication).not.toHaveBeenCalled();
      expect(completePhase).not.toHaveBeenCalled();
      expect(skipConceptPhase).toHaveBeenCalledExactlyOnceWith(undefined, {
        applicationId: testApplicationId,
      });
      expect(declareCompletenessPhaseIncomplete).not.toHaveBeenCalled();
    });

    it("should use the declareCompletenessPhaseIncomplete method when getting an incompleteness request", async () => {
      const testInput: SetApplicationPhaseStatusInput = {
        applicationId: testApplicationId,
        phaseName: "Completeness",
        phaseStatus: "Incomplete",
      };

      await __setApplicationPhaseStatus(undefined, { input: testInput });
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(getApplication).not.toHaveBeenCalled();
      expect(completePhase).not.toHaveBeenCalled();
      expect(skipConceptPhase).not.toHaveBeenCalled();
      expect(declareCompletenessPhaseIncomplete).toHaveBeenCalledExactlyOnceWith(undefined, {
        applicationId: testApplicationId,
      });
    });

    it("should handle an error appropriately if it occurs in the transaction", async () => {
      mockUpsert.mockRejectedValueOnce(testError);
      await expect(
        __setApplicationPhaseStatus(undefined, { input: testInput })
      ).rejects.toThrowError(testHandlePrismaError);
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });

  describe("__resolveApplicationPhaseDates", () => {
    it("should retrieve the requested dates for the phase and application", async () => {
      const expectedCall = {
        select: {
          dateTypeId: true,
          dateValue: true,
          createdAt: true,
          updatedAt: true,
        },
        where: {
          applicationId: testApplicationId,
          dateType: {
            phaseDateTypes: {
              some: { phaseId: testPhaseId },
            },
          },
        },
      };

      await __resolveApplicationPhaseDates(testInput);
      expect(mockFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("__resolveApplicationPhaseDocuments", () => {
    it("should retrieve the requested documents for the phase and application", async () => {
      const expectedCall = {
        where: {
          applicationId: testApplicationId,
          phaseId: testPhaseId,
        },
      };

      await __resolveApplicationPhaseDocuments(testInput);
      expect(mockFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("__resolveApplicationPhaseName", () => {
    it("should retrieve the phase name", async () => {
      const result = __resolveApplicationPhaseName(testInput);
      expect(result).toBe(testPhaseId);
    });
  });

  describe("__resolveApplicationPhaseStatus", () => {
    it("should retrieve the phase status", async () => {
      const result = __resolveApplicationPhaseStatus(testInput);
      expect(result).toBe(testPhaseStatusId);
    });
  });
});
