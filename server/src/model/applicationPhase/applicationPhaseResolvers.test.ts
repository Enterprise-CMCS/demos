import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __setApplicationPhaseStatus,
  __resolveApplicationPhaseDates,
  __resolveApplicationPhaseName,
  __resolveApplicationPhaseStatus,
  __resolveApplicationPhaseDocuments,
} from "./applicationPhaseResolvers.js";
import { ApplicationPhase as PrismaApplicationPhase } from "@prisma/client";
import { PhaseStatus, PhaseName, SetApplicationPhaseStatusInput } from "../../types.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application/applicationResolvers.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application/applicationResolvers.js", () => ({
  getApplication: vi.fn(),
}));

describe("applicationPhaseResolvers", () => {
  const mockUpsert = vi.fn();
  const mockFindMany = vi.fn();
  const mockPrismaClient = {
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
  const testPhaseId: PhaseName = "Concept";
  const testPhaseStatusId: PhaseStatus = "Started";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testInput: PrismaApplicationPhase = {
    applicationId: testApplicationId,
    phaseId: testPhaseId,
    phaseStatusId: testPhaseStatusId,
    createdAt: testDateValue,
    updatedAt: testDateValue,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("__setApplicationPhaseStatus", () => {
    const testInput: SetApplicationPhaseStatusInput = {
      applicationId: testApplicationId,
      phaseName: testPhaseId,
      phaseStatus: testPhaseStatusId,
    };
    const testError = new Error("Database connection failed");

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
    });

    it("should handle an error appropriately if it occurs", async () => {
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
